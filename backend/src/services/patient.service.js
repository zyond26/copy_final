const prisma = require('../config/prisma');
const { generatePatientCode } = require('../utils/patientCode');

/**
 * Patient Service – business logic layer.
 * Tách biệt khỏi controller để dễ test và tái sử dụng.
 */
const PatientService = {
  /**
   * Tạo bệnh nhân mới (BP-01).
   * Tự động sinh mã bệnh nhân theo format EMR-YYYY-NNNN.
   *
   * @param {object} data - { full_name, dob, gender, phone, email?, address?, citizen_id? }
   * @returns {Promise<object>} Patient record
   */
  async create(data) {
    const patientCode = await generatePatientCode(prisma);

    const patient = await prisma.patients.create({
      data: {
        patient_code: patientCode,
        full_name: data.full_name.trim(),
        dob: new Date(data.dob),
        gender: data.gender.toUpperCase(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        citizen_id: data.citizen_id?.trim() || null,
        user_id: data.user_id ? BigInt(data.user_id) : null,
      },
    });

    return PatientService.serialize(patient);
  },

  async getById(id) {
    const patient = await prisma.patients.findUnique({
      where: { id: BigInt(id) },
    });
    
    if (!patient) {
      const err = new Error('Không tìm thấy hồ sơ bệnh nhân.');
      err.statusCode = 404;
      throw err;
    }
    return PatientService.serialize(patient);
  },

  async getMe(userId) {
    const patient = await prisma.patients.findUnique({
      where: { user_id: BigInt(userId) },
      include: { user_account: true },
    });
    
    if (!patient) {
      const err = new Error('Không tìm thấy hồ sơ bệnh nhân của bạn.');
      err.statusCode = 404;
      throw err;
    }
    return PatientService.serialize(patient);
  },

  async updateMe(userId, data) {
    const patient = await prisma.patients.findUnique({
      where: { user_id: BigInt(userId) },
    });
    
    if (!patient) {
      const err = new Error('Không tìm thấy hồ sơ bệnh nhân của bạn.');
      err.statusCode = 404;
      throw err;
    }

    const updatedData = {};
    if (data.dob) updatedData.dob = new Date(data.dob);
    if (data.gender) updatedData.gender = data.gender.toUpperCase();
    if (data.phone) updatedData.phone = data.phone.trim();
    if (data.address) updatedData.address = data.address.trim();
    
    if (data.full_name) {
      updatedData.full_name = data.full_name.trim();
      await prisma.users.update({
        where: { id: patient.user_id },
        data: { full_name: data.full_name.trim() },
      });
    }

    if (data.username) {
      const usernameTrimmed = data.username.trim();
      const existingUser = await prisma.users.findFirst({
        where: {
          username: usernameTrimmed,
          id: { not: patient.user_id }
        }
      });
      if (existingUser) {
        const err = new Error('Tên tài khoản (username) đã được sử dụng.');
        err.statusCode = 400;
        throw err;
      }
      await prisma.users.update({
        where: { id: patient.user_id },
        data: { username: usernameTrimmed },
      });
    }

    const updatedPatient = await prisma.patients.update({
      where: { id: patient.id },
      data: updatedData,
      include: { user_account: true },
    });

    return PatientService.serialize(updatedPatient);
  },
  
  /**
   * Xóa bệnh nhân (BP-05).
   * @param {string|number|BigInt} id
   * @returns {Promise<object>} Deleted patient record
   */
  async delete(id) {
    const deletedPatient = await prisma.patients.delete({
      where: { id: BigInt(id) },
    });

    return PatientService.serialize(deletedPatient);
  },

 /**
   * BP-04 - Tìm kiếm bệnh nhân
   * Theo tên, số điện thoại hoặc mã bệnh nhân
   */
 async search(keyword) {
    const patients = await prisma.patients.findMany({
      where: {
        OR: [
          {
            full_name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            patient_code: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return patients.map(PatientService.serialize);
  }, 

  /**
   * Cập nhật thông tin bệnh nhân (BP-02).
   * * @param {number|string} id - ID của bệnh nhân
   * @param {object} data - Các trường dữ liệu cần cập nhật
   * @returns {Promise<object>} Patient đã được cập nhật
   */
  async update(id, data) {
    const bigintId = BigInt(id);

    // 1. Kiểm tra bệnh nhân có tồn tại không
    const existingPatient = await prisma.patients.findUnique({
      where: { id: bigintId },
    });

    if (!existingPatient) {
      const error = new Error('Patient not found');
      error.status = 404;
      throw error;
    }

    // 2. Nếu có cập nhật citizen_id, kiểm tra xem có trùng với bệnh nhân KHÁC không
    if (data.citizen_id?.trim()) {
      const duplicatePatient = await prisma.patients.findFirst({
        where: {
          citizen_id: data.citizen_id.trim(),
          NOT: { id: bigintId } // Loại trừ chính họ ra
        }
      });

      if (duplicatePatient) {
        const error = new Error('Số CCCD/Citizen ID đã tồn tại ở bệnh nhân khác.');
        error.status = 409;
        throw error;
      }
    }

    // 3. Tiến hành cập nhật
    const patient = await prisma.patients.update({
      where: { id: bigintId },
      data: {
        full_name: data.full_name !== undefined ? data.full_name.trim() : undefined,
        dob: data.dob ? new Date(data.dob) : undefined,
        gender: data.gender !== undefined ? data.gender.toUpperCase() : undefined,
        phone: data.phone !== undefined ? data.phone.trim() : undefined,


        email: data.email === null ? null : (data.email !== undefined ? data.email.trim() : undefined),
        address: data.address === null ? null : (data.address !== undefined ? data.address.trim() : undefined),
        citizen_id: data.citizen_id === null ? null : (data.citizen_id !== undefined ? data.citizen_id.trim() : undefined),
      },
    });

    return PatientService.serialize(patient);
  },

  /**
   * Convert BigInt fields to string for JSON serialization.
   * @param {object} patient
   * @returns {object}
   */

  /**
   * Xem danh sách bệnh nhân (Có phân trang)
   * @param {number} page 
   * @param {number} limit 
   * @returns {Promise<{patients: array, total: number, page: number, limit: number}>}
   */
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Chạy song song đếm tổng số dòng và lấy dữ liệu để tối ưu hiệu năng
    const [patients, total] = await prisma.$transaction([
      prisma.patients.findMany({
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          created_at: 'desc', // Mới nhất lên đầu
        },
      }),
      prisma.patients.count(),
    ]);

    return {
      patients: patients.map(PatientService.serialize),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },

  serialize(patient) {
    if (!patient) return null;
    const serialized = {
      ...patient,
      id: patient.id.toString(),
      created_by: patient.created_by?.toString() || null,
      user_id: patient.user_id?.toString() || null,
    };
    if (patient.user_account) {
      serialized.username = patient.user_account.username;
    }
    return serialized;
  },

  /**
   * Tự động quét và gộp các hồ sơ bệnh nhân trùng lặp.
   * Giao dịch (Transaction) chuyển các bản ghi từ các hồ sơ bị trùng lặp sang hồ sơ gốc, sau đó xóa hồ sơ phụ.
   */
  async autoMerge(adminId) {
    let mergeCount = 0;
    
    // 1. Quét theo citizen_id (Những người có citizen_id giống nhau và không rỗng)
    const duplicateCitizenIds = await prisma.patients.groupBy({
      by: ['citizen_id'],
      having: { citizen_id: { _count: { gt: 1 } } }
    });
    
    for (const group of duplicateCitizenIds) {
      if (!group.citizen_id) continue;
      const patientsList = await prisma.patients.findMany({
        where: { citizen_id: group.citizen_id },
        orderBy: { created_at: 'asc' }
      });
      mergeCount += await performMergeTransaction(patientsList, adminId);
    }
    
    // 2. Quét theo (full_name, dob, phone) loại trừ null
    const duplicateInfos = await prisma.patients.groupBy({
      by: ['full_name', 'dob', 'phone'],
      having: { full_name: { _count: { gt: 1 } } }
    });
    
    for (const group of duplicateInfos) {
      if (!group.full_name || !group.dob || !group.phone) continue;
      const patientsList = await prisma.patients.findMany({
        where: { 
           full_name: group.full_name,
           dob: group.dob,
           phone: group.phone
        },
        orderBy: { created_at: 'asc' }
      });
      if (patientsList.length > 1) {
        mergeCount += await performMergeTransaction(patientsList, adminId);
      }
    }
    
    return { success: true, merged_groups: mergeCount };
  }
};

// Helper for PatientService
async function performMergeTransaction(patientsList, adminId) {
  if (patientsList.length <= 1) return 0;
  
  const primary = patientsList[0];
  const duplicates = patientsList.slice(1);
  let handled = 0;

  for (const dup of duplicates) {
    await prisma.$transaction(async (tx) => {
      const primaryId = primary.id;
      const dupId = dup.id;

      // Cập nhật các bảng liên quan sang Primary Patient
      await tx.medical_records.updateMany({ where: { patient_id: dupId }, data: { patient_id: primaryId } });
      await tx.medical_record_versions.updateMany({ where: { patient_id: dupId }, data: { patient_id: primaryId } });
      await tx.appointments.updateMany({ where: { patient_id: dupId }, data: { patient_id: primaryId } });
      await tx.break_glass.updateMany({ where: { patient_id: dupId }, data: { patient_id: primaryId } });
      await tx.audit_logs.updateMany({ where: { patient_id: dupId }, data: { patient_id: primaryId } });

      if (dup.user_id) {
         // Thay đổi email/username/password để tránh conflict và chặn đăng nhập (không sửa status để tránh constraint lỗi)
         await tx.users.update({
           where: { id: dup.user_id },
           data: { 
             citizen_id: null,
             username: `del_${dup.user_id}`,
             email: `del_${dup.user_id}@deleted.local`,
             password_hash: `*DELETED*${Date.now()}`
           }
         });
      }

      await tx.patients.delete({ where: { id: dupId } });

      // Ghi log vào primary patient
      await tx.audit_logs.create({
        data: {
          user_id: adminId ? BigInt(adminId) : null,
          patient_id: primaryId,
          action: 'MERGE_DUPLICATE',
          entity_type: 'patients',
          entity_id: primaryId,
          old_value: { duplicate_patient_id: dupId.toString() },
          new_value: { merged: true }
        }
      });
    });
    handled++;
  }
  return handled > 0 ? 1 : 0;
}

module.exports = PatientService;