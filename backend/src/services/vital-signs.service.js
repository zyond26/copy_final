const prisma = require('../config/prisma');
const { getCurrentTime } = require('../utils/time');

/**
 * Audit Logger Helper
 */
const logAudit = async ({ user_id, patient_id, action, entity_type, entity_id, ip_address }) => {
  try {
    let finalPatientId = null;
    if (patient_id) {
      const patientExists = await prisma.patients.findUnique({
        where: { id: BigInt(patient_id) }
      });
      if (patientExists) {
        finalPatientId = BigInt(patient_id);
      }
    }

    await prisma.audit_logs.create({
      data: {
        user_id: user_id ? BigInt(user_id) : null,
        patient_id: finalPatientId,
        action,
        entity_type,
        entity_id: entity_id ? BigInt(entity_id) : null,
        ip_address: ip_address || '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
};

/**
 * Parse blood_pressure string "systolic/diastolic" → { systolic, diastolic }
 * Returns null values if unparseable.
 */
const parseBP = (bpString) => {
  if (!bpString) return { systolic: null, diastolic: null };
  const match = String(bpString).match(/^(\d+)\/(\d+)$/);
  if (!match) return { systolic: null, diastolic: null };
  return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
};

/**
 * Kiểm tra sinh hiệu bất thường (SH-03).
 * blood_pressure lưu dạng chuỗi "120/80", ta parse để so ngưỡng.
 */
const checkAbnormalVitals = (vitals) => {
  const alerts = [];

  if (vitals.temperature !== null && vitals.temperature !== undefined) {
    const temp = parseFloat(vitals.temperature);
    if (temp > 38.0) alerts.push(`Nhiệt độ cao (Sốt): ${temp}°C`);
    if (temp < 36.0) alerts.push(`Nhiệt độ thấp: ${temp}°C`);
  }

  if (vitals.blood_pressure) {
    const { systolic, diastolic } = parseBP(vitals.blood_pressure);
    if (systolic !== null) {
      if (systolic > 140) alerts.push(`Huyết áp tâm thu cao: ${systolic} mmHg`);
      if (systolic < 90) alerts.push(`Huyết áp tâm thu thấp: ${systolic} mmHg`);
    }
    if (diastolic !== null) {
      if (diastolic > 90) alerts.push(`Huyết áp tâm trương cao: ${diastolic} mmHg`);
      if (diastolic < 60) alerts.push(`Huyết áp tâm trương thấp: ${diastolic} mmHg`);
    }
  }

  if (vitals.heart_rate !== null && vitals.heart_rate !== undefined) {
    if (vitals.heart_rate > 100) alerts.push(`Nhịp tim cao (Tachycardia): ${vitals.heart_rate} bpm`);
    if (vitals.heart_rate < 60) alerts.push(`Nhịp tim thấp (Bradycardia): ${vitals.heart_rate} bpm`);
  }

  if (vitals.spo2 !== null && vitals.spo2 !== undefined) {
    if (vitals.spo2 < 95) alerts.push(`SpO2 thấp (Giảm oxy máu): ${vitals.spo2}%`);
  }

  return alerts;
};

/**
 * Serialize BigInt and computed fields for JSON safety.
 */
const serialize = (item) => {
  if (!item) return null;

  const serialized = {
    ...item,
    id: item.id.toString(),
    medical_record_id: item.medical_record_id.toString(),
    nurse_id: item.nurse_id.toString(),
  };

  if (item.users) {
    serialized.users = {
      ...item.users,
      id: item.users.id.toString(),
    };
  }

  if (item.medical_records) {
    serialized.medical_records = {
      ...item.medical_records,
      id: item.medical_records.id?.toString(),
      patient_id: item.medical_records.patient_id?.toString(),
      doctor_id: item.medical_records.doctor_id?.toString(),
    };
    if (item.medical_records.patients) {
      serialized.medical_records.patients = {
        ...item.medical_records.patients,
        id: item.medical_records.patients.id?.toString(),
      };
    }
  }

  // Cảnh báo bất thường (SH-03)
  const alerts = checkAbnormalVitals(item);
  serialized.is_abnormal = alerts.length > 0;
  serialized.alerts = alerts;

  return serialized;
};

/**
 * VitalSigns Service – business logic layer.
 *
 * Schema thực tế (vital_signs):
 *   id, medical_record_id (required), nurse_id,
 *   temperature, blood_pressure (String "sys/dia"), heart_rate, spo2, weight, note,
 *   created_at
 *
 * KHÔNG có: patient_id, bp_systolic, bp_diastolic, respiration
 */
const VitalSignsService = {

  /**
   * Ghi nhận sinh hiệu mới (SH-01).
   * Chỉ NURSE mới được gọi; medical_record_id là bắt buộc.
   */
  async create(data, user, ipAddress) {
    // Kiểm tra bệnh án tồn tại & lấy patient_id cho audit log
    const record = await prisma.medical_records.findUnique({
      where: { id: BigInt(data.medical_record_id) },
    });
    if (!record) {
      const err = new Error('Không tìm thấy bệnh án (medical_record_id).');
      err.statusCode = 404;
      throw err;
    }

    const vitalSigns = await prisma.vital_signs.create({
      data: {
        medical_record_id: BigInt(data.medical_record_id),
        nurse_id: BigInt(user.id),
        temperature: data.temperature !== undefined && data.temperature !== null
          ? parseFloat(data.temperature) : null,
        blood_pressure: data.blood_pressure?.trim() || null,
        heart_rate: data.heart_rate !== undefined && data.heart_rate !== null
          ? parseInt(data.heart_rate) : null,
        spo2: data.spo2 !== undefined && data.spo2 !== null
          ? parseInt(data.spo2) : null,
        weight: data.weight !== undefined && data.weight !== null
          ? parseFloat(data.weight) : null,
        note: data.note?.trim() || null,
      },
      include: {
        users: {
          select: { id: true, username: true, full_name: true, role_ref: { select: { name: true } } },
        },
        medical_records: {
          select: {
            id: true,
            record_code: true,
            patient_id: true,
            doctor_id: true,
            patients: { select: { id: true, full_name: true } }
          },
        },
      },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: record.patient_id,
      action: 'CREATE',
      entity_type: 'vital_signs',
      entity_id: vitalSigns.id,
      ip_address: ipAddress,
    });

    return serialize(vitalSigns);
  },

  /**
   * Lấy chi tiết một bản ghi sinh hiệu.
   */
  async findById(id, user, ipAddress) {
    const vitalSigns = await prisma.vital_signs.findUnique({
      where: { id: BigInt(id) },
      include: {
        users: { select: { id: true, username: true, full_name: true, role_ref: { select: { name: true } } } },
        medical_records: {
          select: {
            id: true,
            record_code: true,
            patient_id: true,
            doctor_id: true,
            patients: { select: { id: true, full_name: true } }
          }
        },
      },
    });

    if (!vitalSigns) {
      const err = new Error('Không tìm thấy bản ghi sinh hiệu.');
      err.statusCode = 404;
      throw err;
    }

    // Phân quyền: Bệnh nhân chỉ xem được sinh hiệu thuộc bệnh án của chính mình
    if (user.role === 'PATIENT') {
      const patient = await prisma.patients.findUnique({ where: { user_id: BigInt(user.id) } });
      if (!patient || vitalSigns.medical_records.patient_id !== patient.id) {
        const err = new Error('Bạn không có quyền truy cập sinh hiệu của người khác.');
        err.statusCode = 403;
        throw err;
      }
    }

    await logAudit({
      user_id: user.id,
      patient_id: vitalSigns.medical_records?.patient_id || null,
      action: 'READ',
      entity_type: 'vital_signs',
      entity_id: vitalSigns.id,
      ip_address: ipAddress,
    });

    return serialize(vitalSigns);
  },

  /**
   * Lấy danh sách toàn bộ sinh hiệu (Có phân quyền và phân trang) (SH-02).
   */
  async findAll(page = 1, limit = 10, user, ipAddress) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Phân quyền theo chuẩn ISO 27799
    if (user.role === 'PATIENT') {
      const patient = await prisma.patients.findUnique({ where: { user_id: BigInt(user.id) } });
      if (patient) {
        whereClause.medical_records = {
          patient_id: patient.id
        };
      } else {
        return { items: [], total: 0, page: parseInt(page), limit: parseInt(limit) };
      }
    } else if (user.role === 'DOCTOR') {
      // Bác sĩ chỉ xem sinh hiệu của bệnh nhân mà mình phụ trách khám (qua medical_records)
      whereClause.medical_records = {
        doctor_id: BigInt(user.id)
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.vital_signs.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          users: { select: { id: true, username: true, full_name: true, role_ref: { select: { name: true } } } },
          medical_records: {
            select: {
              id: true,
              record_code: true,
              patient_id: true,
              doctor_id: true,
              patients: { select: { id: true, full_name: true } }
            }
          },
        },
      }),
      prisma.vital_signs.count({ where: whereClause }),
    ]);

    await logAudit({
      user_id: user.id,
      patient_id: null,
      action: 'READ_LIST',
      entity_type: 'vital_signs',
      entity_id: null,
      ip_address: ipAddress,
    });

    return {
      items: items.map(serialize),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },

  /**
   * Lấy lịch sử sinh hiệu theo bệnh nhân (patient_id).
   * Lấy lịch sử sinh hiệu theo bệnh nhân (patient_code).
   * Tra qua medical_records → vital_signs.
   */
  async findByPatient(patientCode, page = 1, limit = 10, user, ipAddress) {
    const patient = await prisma.patients.findUnique({
      where: { patient_code: patientCode }
    });

    if (!patient) {
      const err = new Error('Không tìm thấy bệnh nhân với mã đã cung cấp.');
      err.statusCode = 404;
      throw err;
    }

    // Phân quyền: Bệnh nhân chỉ xem của chính mình
    if (user.role === 'PATIENT') {
      const userPatient = await prisma.patients.findUnique({ where: { user_id: BigInt(user.id) } });
      if (!userPatient || userPatient.id !== patient.id) {
        const err = new Error('Bạn không có quyền truy cập sinh hiệu của người khác.');
        err.statusCode = 403;
        throw err;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy tất cả medical_record_id của bệnh nhân này
    const records = await prisma.medical_records.findMany({
      where: { patient_id: patient.id },
      select: { id: true },
    });
    const recordIds = records.map((r) => r.id);

    const [items, total] = await prisma.$transaction([
      prisma.vital_signs.findMany({
        where: { medical_record_id: { in: recordIds } },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          users: { select: { id: true, username: true, full_name: true, role_ref: { select: { name: true } } } },
          medical_records: {
            select: {
              id: true,
              record_code: true,
              patient_id: true,
              patients: { select: { id: true, full_name: true } }
            }
          },
        },
      }),
      prisma.vital_signs.count({ where: { medical_record_id: { in: recordIds } } }),
    ]);

    await logAudit({
      user_id: user.id,
      patient_id: patient.id,
      action: 'READ_LIST',
      entity_type: 'vital_signs',
      entity_id: null,
      ip_address: ipAddress,
    });

    return {
      items: items.map(serialize),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },

  /**
   * Lấy lịch sử sinh hiệu theo bệnh án (record_code).
   */
  async findByRecord(recordCode, user, ipAddress) {
    const record = await prisma.medical_records.findUnique({
      where: { record_code: recordCode },
    });

    if (!record) {
      const err = new Error('Không tìm thấy bệnh án.');
      err.statusCode = 404;
      throw err;
    }

    // Phân quyền
    if (user.role === 'PATIENT') {
      const patient = await prisma.patients.findUnique({ where: { user_id: BigInt(user.id) } });
      if (!patient || record.patient_id !== patient.id) {
        const err = new Error('Bạn không có quyền truy cập sinh hiệu của người khác.');
        err.statusCode = 403;
        throw err;
      }
    }

    const items = await prisma.vital_signs.findMany({
      where: { medical_record_id: record.id },
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, username: true, full_name: true, role_ref: { select: { name: true } } } },
        medical_records: { select: { id: true, record_code: true, patient_id: true } },
      },
    });

    await logAudit({
      user_id: user.id,
      patient_id: record.patient_id,
      action: 'READ_LIST',
      entity_type: 'vital_signs',
      entity_id: null,
      ip_address: ipAddress,
    });

    return items.map(serialize);
  },

  /**
   * Lấy dữ liệu biểu đồ sinh hiệu trong N ngày gần nhất (SH-02).
   */
  async getChartData(patientCode, days = 30, user, ipAddress) {
    const patient = await prisma.patients.findUnique({
      where: { patient_code: patientCode }
    });

    if (!patient) {
      const err = new Error('Không tìm thấy bệnh nhân với mã đã cung cấp.');
      err.statusCode = 404;
      throw err;
    }

    // Phân quyền
    if (user.role === 'PATIENT') {
      const userPatient = await prisma.patients.findUnique({ where: { user_id: BigInt(user.id) } });
      if (!userPatient || userPatient.id !== patient.id) {
        const err = new Error('Bạn không có quyền truy cập dữ liệu của người khác.');
        err.statusCode = 403;
        throw err;
      }
    }

    const startDate = getCurrentTime();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Lấy record_ids của bệnh nhân
    const records = await prisma.medical_records.findMany({
      where: { patient_id: patient.id },
      select: { id: true },
    });
    const recordIds = records.map((r) => r.id);

    const items = await prisma.vital_signs.findMany({
      where: {
        medical_record_id: { in: recordIds },
        created_at: { gte: startDate },
      },
      orderBy: { created_at: 'asc' },
      include: {
        medical_records: { select: { id: true, record_code: true, patient_id: true } },
      },
    });

    await logAudit({
      user_id: user.id,
      patient_id: patient.id,
      action: 'READ_CHART',
      entity_type: 'vital_signs',
      entity_id: null,
      ip_address: ipAddress,
    });

    // Format dữ liệu cho biểu đồ
    return items.map((item) => {
      const s = serialize(item);
      // Parse blood_pressure cho biểu đồ
      const { systolic, diastolic } = parseBP(item.blood_pressure);
      return {
        ...s,
        bp_systolic: systolic,
        bp_diastolic: diastolic,
        recorded_at: item.created_at,
      };
    });
  },

  /**
   * Cập nhật sinh hiệu (chỉ điều dưỡng đã ghi hoặc admin).
   */
  async update(id, data, user, ipAddress) {
    const current = await prisma.vital_signs.findUnique({
      where: { id: BigInt(id) },
      include: { medical_records: { select: { patient_id: true } } },
    });

    if (!current) {
      const err = new Error('Không tìm thấy bản ghi sinh hiệu.');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra quyền: Chỉ người tạo ra hoặc Admin mới được sửa
    if (user.role !== 'ADMIN' && current.nurse_id !== BigInt(user.id)) {
      const err = new Error('Bạn không có quyền chỉnh sửa bản ghi này.');
      err.statusCode = 403;
      throw err;
    }

    const updated = await prisma.vital_signs.update({
      where: { id: current.id },
      data: {
        temperature: data.temperature !== undefined
          ? (data.temperature !== null ? parseFloat(data.temperature) : null)
          : current.temperature,
        blood_pressure: data.blood_pressure !== undefined
          ? (data.blood_pressure?.trim() || null)
          : current.blood_pressure,
        heart_rate: data.heart_rate !== undefined
          ? (data.heart_rate !== null ? parseInt(data.heart_rate) : null)
          : current.heart_rate,
        spo2: data.spo2 !== undefined
          ? (data.spo2 !== null ? parseInt(data.spo2) : null)
          : current.spo2,
        weight: data.weight !== undefined
          ? (data.weight !== null ? parseFloat(data.weight) : null)
          : current.weight,
        note: data.note !== undefined ? (data.note?.trim() || null) : current.note,
      },
      include: {
        users: { select: { id: true, username: true, full_name: true, role_ref: { select: { name: true } } } },
        medical_records: { select: { id: true, record_code: true, patient_id: true } },
      },
    });

    await logAudit({
      user_id: user.id,
      patient_id: updated.medical_records?.patient_id || null,
      action: 'UPDATE',
      entity_type: 'vital_signs',
      entity_id: updated.id,
      ip_address: ipAddress,
    });

    return serialize(updated);
  },

  /**
   * Xóa sinh hiệu (chỉ Admin).
   */
  async delete(id, user, ipAddress) {
    const current = await prisma.vital_signs.findUnique({
      where: { id: BigInt(id) },
      include: { medical_records: { select: { patient_id: true } } },
    });

    if (!current) {
      const err = new Error('Không tìm thấy bản ghi sinh hiệu.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.vital_signs.delete({ where: { id: BigInt(id) } });

    await logAudit({
      user_id: user.id,
      patient_id: current.medical_records?.patient_id || null,
      action: 'DELETE',
      entity_type: 'vital_signs',
      entity_id: current.id,
      ip_address: ipAddress,
    });

    return { message: 'Xóa sinh hiệu thành công.' };
  },
};

module.exports = VitalSignsService;
