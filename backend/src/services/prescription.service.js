const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken'); // Tận dụng thư viện mã hóa có sẵn trong node_modules

/**
 * Hàm giải mã Token thủ công để lấy thông tin Bác sĩ/Bệnh nhân
 */
const extractUserFromToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Yêu cầu cung cấp Token xác thực hợp lệ (Bearer Token).');
    err.statusCode = 401;
    throw err;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    // Giải mã token bằng Secret Key trong file .env của bạn
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    return decoded; // Trả về object chứa id, role, email...
  } catch (error) {
    const err = new Error('Token đã hết hạn hoặc không hợp lệ.');
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Hàm ghi nhật ký bảo mật (Audit Log) theo chuẩn ISO 27799
 */
const logAudit = async (tx, { user_id, patient_id, action, entity_type, entity_id, ip_address }) => {
  try {
    const client = tx || prisma;
    await client.audit_logs.create({
      data: {
        user_id: user_id ? BigInt(user_id) : null,
        patient_id: patient_id ? BigInt(patient_id) : null,
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

const PrescriptionService = {
  /**
   * CHỨC NĂNG 1: KÊ ĐƠN THUỐC MỚI
   */
  async create(medicalRecordId, data, authHeader, ipAddress) {
    // Tự động giải mã token lấy thông tin user trực tiếp tại Service
    const user = extractUserFromToken(authHeader);

    if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
      const err = new Error('Chỉ có Bác sĩ hoặc Admin mới có quyền kê đơn thuốc.');
      err.statusCode = 403;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const record = await tx.medical_records.findUnique({
        where: { id: BigInt(medicalRecordId) },
      });

      if (!record) {
        const err = new Error('Không tìm thấy hồ sơ bệnh án để kê đơn.');
        err.statusCode = 404;
        throw err;
      }

      if (record.status === 'CLOSED') {
        const err = new Error('Bệnh án này đã đóng. Không thể thêm đơn thuốc mới.');
        err.statusCode = 400;
        throw err;
      }

      const prescription = await tx.prescriptions.create({
        data: {
          medical_record_id: record.id,
          doctor_id: BigInt(user.id),
          note: data.note?.trim() || null,
        },
      });

      if (data.items && data.items.length > 0) {
        const itemData = data.items.map((item) => ({
          prescription_id: prescription.id,
          medicine_name: item.medicine_name.trim(),
          dosage: item.dosage?.trim() || null,
          frequency: item.frequency?.trim() || null,
          duration_days: item.duration_days ? parseInt(item.duration_days) : null,
          instruction: item.instruction?.trim() || null,
        }));

        await tx.prescription_items.createMany({ data: itemData });
      }

      const fullPrescription = await tx.prescriptions.findUnique({
        where: { id: prescription.id },
        include: { prescription_items: true },
      });

      await logAudit(tx, {
        user_id: user.id,
        patient_id: record.patient_id,
        action: 'CREATE_PRESCRIPTION',
        entity_type: 'prescriptions',
        entity_id: prescription.id,
        ip_address: ipAddress,
      });

      return PrescriptionService.serialize(fullPrescription);
    });
  },

  /**
   * CHỨC NĂNG 2: XEM ĐƠN THUỐC CHI TIẾT
   */
  async findById(id, authHeader, ipAddress) {
    const user = extractUserFromToken(authHeader);

    const prescription = await prisma.prescriptions.findUnique({
      where: { id: BigInt(id) },
      include: {
        prescription_items: true,
        medical_records: true,
      },
    });

    if (!prescription) {
      const err = new Error('Đơn thuốc không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    if (user.role === 'PATIENT') {
      const patientProfile = await prisma.patients.findFirst({
        where: { user_id: BigInt(user.id) },
      });
      if (!patientProfile || prescription.medical_records.patient_id !== patientProfile.id) {
        const err = new Error('Bạn không có quyền xem đơn thuốc của người khác.');
        err.statusCode = 403;
        throw err;
      }
    }

    await logAudit(null, {
      user_id: user.id,
      patient_id: prescription.medical_records.patient_id,
      action: 'READ_PRESCRIPTION',
      entity_type: 'prescriptions',
      entity_id: prescription.id,
      ip_address: ipAddress,
    });

    return PrescriptionService.serialize(prescription);
  },

  /**
   * CHỨC NĂNG 3: CẬP NHẬT ĐƠN THUỐC
   */
  async update(id, data, authHeader, ipAddress) {
    const user = extractUserFromToken(authHeader);

    return await prisma.$transaction(async (tx) => {
      const current = await tx.prescriptions.findUnique({
        where: { id: BigInt(id) },
        include: { medical_records: true },
      });

      if (!current) {
        const err = new Error('Không tìm thấy đơn thuốc cần cập nhật.');
        err.statusCode = 404;
        throw err;
      }

      if (current.medical_records.status === 'CLOSED') {
        const err = new Error('Bệnh án liên quan đã đóng. Không thể cập nhật đơn thuốc.');
        err.statusCode = 400;
        throw err;
      }

      if (current.doctor_id !== BigInt(user.id) && user.role !== 'ADMIN') {
        const err = new Error('Bạn không có quyền chỉnh sửa đơn thuốc của bác sĩ khác.');
        err.statusCode = 403;
        throw err;
      }

      await tx.prescriptions.update({
  where: { id: current.id },
  data: {
    note: data.notes !== undefined ? data.notes?.trim() : current.note,
    // Đã xóa updated_at để khớp 100% với Schema của bạn
  },
});

      if (data.items) {
        await tx.prescription_items.deleteMany({
          where: { prescription_id: current.id },
        });

        if (data.items.length > 0) {
          const itemData = data.items.map((item) => ({
            prescription_id: current.id,
            medicine_name: item.medicine_name.trim(),
            dosage: item.dosage?.trim() || null,
            frequency: item.frequency?.trim() || null,
            duration_days: item.duration_days ? parseInt(item.duration_days) : null,
            instruction: item.instruction?.trim() || null,
          }));
          await tx.prescription_items.createMany({ data: itemData });
        }
      }

      const updated = await tx.prescriptions.findUnique({
        where: { id: current.id },
        include: { prescription_items: true },
      });

      await logAudit(tx, {
        user_id: user.id,
        patient_id: current.medical_records.patient_id,
        action: 'UPDATE_PRESCRIPTION',
        entity_type: 'prescriptions',
        entity_id: current.id,
        ip_address: ipAddress,
      });

      return PrescriptionService.serialize(updated);
    });
  },

  /**
   * CHỨC NĂNG 4: IN ĐƠN THUỐC
   */
  async generatePDF(id, authHeader, ipAddress) {
    const user = extractUserFromToken(authHeader);

    const prescription = await prisma.prescriptions.findUnique({
      where: { id: BigInt(id) },
      include: {
        prescription_items: true,
        medical_records: {
          include: { patients: true, users: true },
        },
      },
    });

    if (!prescription) {
      const err = new Error('Đơn thuốc không tồn tại để tiến hành in.');
      err.statusCode = 404;
      throw err;
    }

    await logAudit(null, {
      user_id: user.id,
      patient_id: prescription.medical_records.patient_id,
      action: 'PRINT_PRESCRIPTION',
      entity_type: 'prescriptions',
      entity_id: prescription.id,
      ip_address: ipAddress,
    });

    return prescription;
  },

  /**
   * Bộ lọc đệ quy chuyển đổi TẤT CẢ thuộc tính BigInt sang String 
   * Giải quyết triệt để lỗi "Do not know how to serialize a BigInt"
   */
  serialize(data) {
    if (data === null || data === undefined) return null;

    // Nếu là kiểu BigInt, ép trực tiếp sang chuỗi
    if (typeof data === 'bigint') {
      return data.toString();
    }

    // Nếu là một mảng, chạy vòng lặp lọc từng phần tử bên trong
    if (Array.isArray(data)) {
      return data.map(item => PrescriptionService.serialize(item));
    }

    // Nếu là một Object, duyệt qua từng key để chuyển đổi
    if (typeof data === 'object') {
      const serialized = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          serialized[key] = PrescriptionService.serialize(data[key]);
        }
      }
      return serialized;
    }

    return data;
  },
};

module.exports = PrescriptionService;