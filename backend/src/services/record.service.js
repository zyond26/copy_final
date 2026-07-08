const prisma = require('../config/prisma');
const { generateRecordCode } = require('../utils/recordCode');
const { encrypt, decrypt } = require('../utils/crypto');
const { getCurrentTime } = require('../utils/time');

/**
 * Audit Logger Helper
 */
const logAudit = async ({ user_id, patient_id, action, entity_type, entity_id, ip_address, break_glass = false, break_glass_reason = null }) => {
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
        break_glass,
        break_glass_reason,
      },
    });
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
};

/**
 * Record Service – business logic layer for medical records.
 */
const RecordService = {
  /**
   * Resolve patient ID for PATIENT role based on email or citizen_id.
   */
  async getPatientIdFromUser(user) {
    if (user.role !== 'PATIENT') return null;

    // 1. Tìm bệnh nhân liên kết trực tiếp qua user_id
    let patient = await prisma.patients.findUnique({
      where: { user_id: BigInt(user.id) },
    });

    // 2. Dự phòng tìm qua email nếu không tìm thấy liên kết trực tiếp
    if (!patient && user.email) {
      patient = await prisma.patients.findFirst({
        where: { email: user.email },
      });
    }

    if (!patient) {
      const err = new Error('Không tìm thấy hồ sơ hành chính của bệnh nhân khớp với tài khoản này.');
      err.statusCode = 403;
      throw err;
    }

    return patient.id;
  },

  /**
   * Tạo bệnh án mới (BA-01).
   */
  async create(data, user, ipAddress) {
    const recordCode = await generateRecordCode(prisma);

    let patientId;
    const inputPatientId = String(data.patient_id).trim();
    if (inputPatientId.toUpperCase().startsWith('EMR-')) {
      const patient = await prisma.patients.findUnique({
        where: { patient_code: inputPatientId }
      });
      if (!patient) {
        const err = new Error(`Không tìm thấy hồ sơ hành chính của bệnh nhân có mã ${inputPatientId}`);
        err.statusCode = 404;
        throw err;
      }
      patientId = patient.id;
    } else {
      try {
        patientId = BigInt(inputPatientId);
      } catch (e) {
        const err = new Error('ID bệnh nhân không hợp lệ (phải là số hoặc mã EMR-YYYY-NNNN).');
        err.statusCode = 400;
        throw err;
      }

      const patient = await prisma.patients.findUnique({
        where: { id: patientId }
      });
      if (!patient) {
        const err = new Error(`Không tìm thấy bệnh nhân có ID ${inputPatientId}`);
        err.statusCode = 404;
        throw err;
      }
    }

    const record = await prisma.medical_records.create({
      data: {
        record_code: recordCode,
        patient_id: patientId,
        doctor_id: BigInt(user.id),
        symptoms: data.symptoms ? encrypt(data.symptoms.trim()) : null,
        diagnosis: encrypt(data.diagnosis.trim()),
        conclusion: data.conclusion ? encrypt(data.conclusion.trim()) : null,
        visit_date: data.visit_date ? new Date(data.visit_date) : getCurrentTime(),
        status: 'OPEN',
      },
      include: {
        patients: true,
        users: { include: { role_ref: true } },
      },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: record.patient_id,
      action: 'CREATE',
      entity_type: 'medical_records',
      entity_id: record.id,
      ip_address: ipAddress,
    });

    return RecordService.serialize(record);
  },

  /**
   * Cập nhật bệnh án (BA-03).
   * Chỉ bác sĩ tạo bệnh án mới được quyền sửa.
   */
  async update(id, data, user, ipAddress) {
    const current = await prisma.medical_records.findUnique({
      where: { id: BigInt(id) },
    });

    if (!current) {
      const err = new Error('Không tìm thấy bệnh án yêu cầu.');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra quyền chỉnh sửa (chỉ bác sĩ tạo ra bệnh án mới được chỉnh sửa)
    if (current.doctor_id !== BigInt(user.id)) {
      const err = new Error('Bạn không có quyền chỉnh sửa bệnh án này (Chỉ bác sĩ lập bệnh án mới được quyền sửa).');
      err.statusCode = 403;
      throw err;
    }

    // Kiểm tra trạng thái bệnh án (Chặn sửa nếu bệnh án đã CLOSED)
    if (current.status === 'CLOSED') {
      const err = new Error('Bệnh án đã được đóng (CLOSED) và không thể chỉnh sửa.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Sao lưu trạng thái hiện tại thành một phiên bản lịch sử (BA-04)
    const latestVersion = await prisma.medical_record_versions.findFirst({
      where: { medical_record_id: current.id },
      orderBy: { version: 'desc' },
    });
    const nextVer = latestVersion ? latestVersion.version + 1 : 1;

    await prisma.medical_record_versions.create({
      data: {
        medical_record_id: current.id,
        record_code: current.record_code,
        patient_id: current.patient_id,
        doctor_id: current.doctor_id,
        symptoms: current.symptoms,
        diagnosis: current.diagnosis,
        conclusion: current.conclusion,
        visit_date: current.visit_date,
        status: current.status,
        version: nextVer,
        changed_by: BigInt(user.id),
      },
    });

    // 2. Tiến hành cập nhật bệnh án
    const updated = await prisma.medical_records.update({
      where: { id: current.id },
      data: {
        symptoms: data.symptoms !== undefined ? (data.symptoms ? encrypt(data.symptoms.trim()) : null) : undefined,
        diagnosis: data.diagnosis !== undefined ? (data.diagnosis ? encrypt(data.diagnosis.trim()) : undefined) : undefined,
        conclusion: data.conclusion !== undefined ? (data.conclusion ? encrypt(data.conclusion.trim()) : null) : undefined,
        status: data.status !== undefined ? data.status.toUpperCase() : current.status,
        updated_at: getCurrentTime(),
      },
      include: {
        patients: true,
        users: { include: { role_ref: true } },
      },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: updated.patient_id,
      action: 'UPDATE',
      entity_type: 'medical_records',
      entity_id: updated.id,
      ip_address: ipAddress,
    });

    return RecordService.serialize(updated);
  },

  /**
   * Lấy chi tiết bệnh án (BA-02).
   */
  async findById(id, user, ipAddress, breakGlassReason = null, isExport = false) {
    const record = await prisma.medical_records.findUnique({
      where: { id: BigInt(id) },
      include: {
        patients: true,
        users: { include: { role_ref: true } },
        vital_signs: {
          orderBy: { created_at: 'desc' },
        },
        prescriptions: {
          include: {
            prescription_items: true,
          },
        },
      },
    });

    if (!record) {
      const err = new Error('Không tìm thấy bệnh án.');
      err.statusCode = 404;
      throw err;
    }

    let isBreakGlass = false;
    let actualReason = null;

    // Phân quyền: Bệnh nhân chỉ xem được bệnh án của chính mình
    if (user.role === 'PATIENT') {
      const patientId = await RecordService.getPatientIdFromUser(user);
      if (record.patient_id !== patientId) {
        const err = new Error('Bạn không có quyền truy cập bệnh án của người khác.');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR' || user.role === 'NURSE') {
      // Kiểm tra xem bác sĩ truy cập có phải bác sĩ điều trị (người tạo bệnh án) hay không
      const isCreator = record.doctor_id === BigInt(user.id);

      if (!isCreator) {
        // 1. Kiểm tra trong DB xem có yêu cầu Break Glass được APPROVED bởi Bác sĩ điều trị tạo bệnh án này còn hiệu lực không
        const approvedRequest = await prisma.break_glass.findFirst({
          where: {
            requested_by: BigInt(user.id),
            patient_id: record.patient_id,
            approved_by: record.doctor_id, // Phải được chính bác sĩ lập bệnh án này phê duyệt
            status: 'APPROVED',
            expires_at: { gte: getCurrentTime() },
          },
        });

        if (approvedRequest) {
          isBreakGlass = true;
          actualReason = `[Doctor Approved #${approvedRequest.id}] ${approvedRequest.reason}`;
        } else {
          const err = new Error('Bạn không có quyền truy cập bệnh án này. Vui lòng gửi yêu cầu Break Glass và chờ bác sĩ lập bệnh án phê duyệt.');
          err.statusCode = 403;
          throw err;
        }
      }
    }

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: record.patient_id,
      action: isExport ? 'EXPORT_PDF' : 'READ',
      entity_type: 'medical_records',
      entity_id: record.id,
      ip_address: ipAddress,
      break_glass: isBreakGlass,
      break_glass_reason: actualReason,
    });

    return RecordService.serialize(record);
  },

  /**
   * Lấy danh sách bệnh án (Phân trang và bộ lọc).
   */
  async findAll(page = 1, limit = 10, patientId = null, user, ipAddress) {
    const skip = (page - 1) * limit;
    const whereClause = {};

    // Phân quyền: Bệnh nhân chỉ xem được bệnh án của chính mình
    if (user.role === 'PATIENT') {
      const selfPatientId = await RecordService.getPatientIdFromUser(user);
      
      // Nếu truyền patientId cụ thể nhưng không khớp với ID của chính mình -> Lỗi 403
      if (patientId && BigInt(patientId) !== selfPatientId) {
        const err = new Error('Bạn không có quyền truy cập bệnh án của người khác.');
        err.statusCode = 403;
        throw err;
      }
      
      whereClause.patient_id = selfPatientId;
    } else if (user.role === 'DOCTOR') {
      // Vá quyền hiển thị (Defense in Depth): Bác sĩ chỉ xem được bệnh án do chính mình khám/tạo
      whereClause.doctor_id = BigInt(user.id);
      if (patientId) {
        whereClause.patient_id = BigInt(patientId);
      }
    } else if (patientId) {
      whereClause.patient_id = BigInt(patientId);
    }

    const [records, total] = await prisma.$transaction([
      prisma.medical_records.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          patients: true,
          users: { include: { role_ref: true } },
        },
      }),
      prisma.medical_records.count({ where: whereClause }),
    ]);

    // Ghi audit log (chung cho tác vụ đọc danh sách)
    await logAudit({
      user_id: user.id,
      patient_id: whereClause.patient_id || null,
      action: 'READ_LIST',
      entity_type: 'medical_records',
      entity_id: null,
      ip_address: ipAddress,
    });

    return {
      records: records.map(RecordService.serialize),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },

  /**
   * Lấy danh sách phiên bản cũ (BA-04 - audit trail).
   */
  async findHistory(id, user, ipAddress) {
    const record = await prisma.medical_records.findUnique({
      where: { id: BigInt(id) },
    });

    if (!record) {
      const err = new Error('Không tìm thấy bệnh án.');
      err.statusCode = 404;
      throw err;
    }

    // Phân quyền: Bệnh nhân chỉ xem được lịch sử bệnh án của mình
    if (user.role === 'PATIENT') {
      const patientId = await RecordService.getPatientIdFromUser(user);
      if (record.patient_id !== patientId) {
        const err = new Error('Bạn không có quyền xem lịch sử bệnh án của người khác.');
        err.statusCode = 403;
        throw err;
      }
    }

    const history = await prisma.medical_record_versions.findMany({
      where: { medical_record_id: BigInt(id) },
      orderBy: { version: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            full_name: true,
            role_ref: { select: { name: true } },
          },
        },
      },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: record.patient_id,
      action: 'READ_HISTORY',
      entity_type: 'medical_records',
      entity_id: record.id,
      ip_address: ipAddress,
    });

    return history.map((h) => ({
      ...h,
      id: h.id.toString(),
      medical_record_id: h.medical_record_id.toString(),
      patient_id: h.patient_id.toString(),
      doctor_id: h.doctor_id.toString(),
      changed_by: h.changed_by.toString(),
      symptoms: h.symptoms ? decrypt(h.symptoms) : null,
      diagnosis: h.diagnosis ? decrypt(h.diagnosis) : null,
      conclusion: h.conclusion ? decrypt(h.conclusion) : null,
      users: h.users ? {
        ...h.users,
        id: h.users.id.toString(),
      } : null,
    }));
  },

  /**
   * Xóa bệnh án (chỉ Admin).
   */
  async delete(id, user, ipAddress) {
    const current = await prisma.medical_records.findUnique({
      where: { id: BigInt(id) },
    });

    if (!current) {
      const err = new Error('Không tìm thấy bệnh án.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.medical_records.delete({
      where: { id: BigInt(id) },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: current.patient_id,
      action: 'DELETE',
      entity_type: 'medical_records',
      entity_id: current.id,
      ip_address: ipAddress,
    });

    return { message: 'Xóa bệnh án thành công.' };
  },

  /**
   * Serialize BigInt fields to String for JSON safety.
   */
  serialize(record) {
    if (!record) return null;
    const serialized = {
      ...record,
      id: record.id.toString(),
      patient_id: record.patient_id.toString(),
      doctor_id: record.doctor_id.toString(),
      symptoms: record.symptoms ? decrypt(record.symptoms) : null,
      diagnosis: record.diagnosis ? decrypt(record.diagnosis) : null,
      conclusion: record.conclusion ? decrypt(record.conclusion) : null,
    };

    if (record.patients) {
      serialized.patients = {
        ...record.patients,
        id: record.patients.id.toString(),
        created_by: record.patients.created_by?.toString() || null,
        user_id: record.patients.user_id?.toString() || null,
      };
      // Thêm alias 'patient' cho Frontend hiển thị tên bệnh nhân
      serialized.patient = {
        id: record.patients.id.toString(),
        full_name: record.patients.full_name,
        patient_code: record.patients.patient_code,
        email: record.patients.email,
      };
    }

    if (record.users) {
      serialized.users = {
        id: record.users.id.toString(),
        username: record.users.username,
        email: record.users.email,
        full_name: record.users.full_name,
        role: record.users.role_ref?.name ?? null,
      };
      // Thêm alias 'doctor' cho Frontend hiển thị tên bác sĩ khám
      serialized.doctor = {
        id: record.users.id.toString(),
        full_name: record.users.full_name,
        email: record.users.email,
      };
    }

    if (record.vital_signs) {
      serialized.vital_signs = record.vital_signs.map((vs) => ({
        ...vs,
        id: vs.id.toString(),
        medical_record_id: vs.medical_record_id.toString(),
        nurse_id: vs.nurse_id.toString(),
      }));
    }

    if (record.prescriptions) {
      serialized.prescriptions = record.prescriptions.map((pres) => ({
        ...pres,
        id: pres.id.toString(),
        medical_record_id: pres.medical_record_id.toString(),
        doctor_id: pres.doctor_id.toString(),
        prescription_items: pres.prescription_items
          ? pres.prescription_items.map((item) => ({
              ...item,
              id: item.id.toString(),
              prescription_id: item.prescription_id.toString(),
            }))
          : [],
      }));
    }

    return serialized;
  },
};

module.exports = RecordService;
