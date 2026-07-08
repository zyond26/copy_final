const prisma = require('../config/prisma');
const { generateAppointmentCode } = require('../utils/appointmentCode');
const { encrypt, decrypt } = require('../utils/crypto');
const EmailService = require('./email.service');
const { generateRecordCode } = require('../utils/recordCode');
const { getCurrentTime } = require('../utils/time');

/**
 * Audit Logger Helper
 */
const logAudit = async ({ user_id, patient_id, action, entity_type, entity_id, ip_address, old_value = null, new_value = null }) => {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: user_id ? BigInt(user_id) : null,
        patient_id: patient_id ? BigInt(patient_id) : null,
        action,
        entity_type,
        entity_id: entity_id ? BigInt(entity_id) : null,
        ip_address: ip_address || '127.0.0.1',
        old_value,
        new_value,
      },
    });
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
};

/**
 * Appointment Service – business logic layer for scheduling and bookings.
 */
const AppointmentService = {
  /**
   * Resolve patient ID for PATIENT role based on email or user_id.
   */
  async getPatientIdFromUser(user) {
    if (user.role !== 'PATIENT') return null;

    let patient = await prisma.patients.findUnique({
      where: { user_id: BigInt(user.id) },
    });

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
   * Đặt lịch hẹn mới (CREATE).
   */
  async create(data, user, ipAddress) {
    let patientId;

    if (user.role === 'PATIENT') {
      // Nếu là bệnh nhân, tự động lấy patientId của chính mình
      patientId = await AppointmentService.getPatientIdFromUser(user);
    } else {
      // Nếu là Lễ tân hoặc Admin, lấy patientId từ payload gửi lên
      if (!data.patient_id) {
        const err = new Error('patient_id (bệnh nhân) là bắt buộc đối với nhân viên y tế.');
        err.statusCode = 400;
        throw err;
      }

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

        // Kiểm tra bệnh nhân có tồn tại không
        const patientExists = await prisma.patients.findUnique({
          where: { id: patientId }
        });
        if (!patientExists) {
          const err = new Error('Bệnh nhân không tồn tại trên hệ thống.');
          err.statusCode = 404;
          throw err;
        }
      }
    }

    // Kiểm tra bác sĩ khám có tồn tại và đúng vai trò DOCTOR không
    const doctorId = BigInt(data.doctor_id);
    const doctorUser = await prisma.users.findUnique({
      where: { id: doctorId },
      include: { role_ref: true }
    });

    if (!doctorUser || doctorUser.role_ref?.name !== 'DOCTOR') {
      const err = new Error('Bác sĩ được chọn không tồn tại hoặc không hợp lệ.');
      err.statusCode = 400;
      throw err;
    }

    // Kiểm tra trùng lịch hẹn khám của bác sĩ (khoảng cách 30 phút)
    const proposedDate = new Date(data.appointment_date);
    const minDate = new Date(proposedDate.getTime() - 30 * 60 * 1000);
    const maxDate = new Date(proposedDate.getTime() + 30 * 60 * 1000);

    const collision = await prisma.appointments.findFirst({
      where: {
        doctor_id: doctorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        appointment_date: {
          gte: minDate,
          lte: maxDate
        }
      }
    });

    if (collision) {
      const err = new Error('Bác sĩ đã có lịch hẹn khác trong khoảng thời gian này (trùng lịch trong vòng 30 phút).');
      err.statusCode = 400;
      throw err;
    }

    const appointmentCode = await generateAppointmentCode(prisma);

    const appointment = await prisma.appointments.create({
      data: {
        appointment_code: appointmentCode,
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: new Date(data.appointment_date),
        reason: data.reason?.trim() ? encrypt(data.reason.trim()) : null,
        notes: data.notes?.trim() ? encrypt(data.notes.trim()) : null,
        status: 'PENDING',
      },
      include: {
        patient: true,
        doctor: { include: { role_ref: true } },
      },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: patientId,
      action: 'CREATE',
      entity_type: 'appointments',
      entity_id: appointment.id,
      ip_address: ipAddress,
      new_value: appointment,
    });

    return AppointmentService.serialize(appointment);
  },

  /**
   * Xem chi tiết 1 lịch khám (READ).
   */
  async findById(id, user, ipAddress) {
    const appointmentId = BigInt(id);

    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: { include: { role_ref: true } },
      },
    });

    if (!appointment) {
      const err = new Error('Không tìm thấy lịch khám.');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra quyền truy cập chi tiết
    if (user.role === 'PATIENT') {
      const patientId = await AppointmentService.getPatientIdFromUser(user);
      if (appointment.patient_id !== patientId) {
        const err = new Error('Bạn không có quyền xem thông tin lịch khám của người khác.');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      if (appointment.doctor_id !== BigInt(user.id)) {
        const err = new Error('Bạn không có quyền xem lịch khám của bác sĩ khác.');
        err.statusCode = 403;
        throw err;
      }
    }

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: appointment.patient_id,
      action: 'READ',
      entity_type: 'appointments',
      entity_id: appointment.id,
      ip_address: ipAddress,
    });

    return AppointmentService.serialize(appointment);
  },

  /**
   * Xem danh sách lịch khám (Phân trang và bộ lọc).
   */
  async findAll(page = 1, limit = 10, filters = {}, user, ipAddress) {
    const skip = (page - 1) * limit;
    const whereClause = {};

    // Phân quyền & lọc tự động
    if (user.role === 'PATIENT') {
      const patientId = await AppointmentService.getPatientIdFromUser(user);
      whereClause.patient_id = patientId;
    } else if (user.role === 'DOCTOR') {
      whereClause.doctor_id = BigInt(user.id);
    } else {
      // Admin/Receptionist/Nurse lọc tùy ý
      if (filters.patient_id) {
        whereClause.patient_id = BigInt(filters.patient_id);
      }
      if (filters.doctor_id) {
        whereClause.doctor_id = BigInt(filters.doctor_id);
      }
    }

    // Lọc theo trạng thái lịch
    if (filters.status) {
      whereClause.status = filters.status.toUpperCase();
    }

    // Lọc theo ngày khám (nếu truyền)
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.appointment_date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [appointments, total] = await prisma.$transaction([
      prisma.appointments.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { appointment_date: 'asc' }, // Sắp xếp giờ khám tăng dần
        include: {
          patient: true,
          doctor: { include: { role_ref: true } },
        },
      }),
      prisma.appointments.count({ where: whereClause }),
    ]);

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: whereClause.patient_id || null,
      action: 'READ_LIST',
      entity_type: 'appointments',
      entity_id: null,
      ip_address: ipAddress,
    });

    return {
      appointments: appointments.map(AppointmentService.serialize),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },

  /**
   * Cập nhật thông tin / Trạng thái lịch hẹn (UPDATE).
   */
  async update(id, data, user, ipAddress) {
    const appointmentId = BigInt(id);

    const current = await prisma.appointments.findUnique({
      where: { id: appointmentId },
    });

    if (!current) {
      const err = new Error('Không tìm thấy lịch khám.');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    const oldVal = { ...current };

    if (user.role === 'PATIENT') {
      const patientId = await AppointmentService.getPatientIdFromUser(user);
      if (current.patient_id !== patientId) {
        const err = new Error('Bạn không có quyền chỉnh sửa lịch hẹn của bệnh nhân khác.');
        err.statusCode = 403;
        throw err;
      }

      // Bệnh nhân chỉ được chỉnh sửa ngày hẹn hoặc hủy lịch (CANCELLED) nếu lịch hẹn ở trạng thái PENDING
      if (current.status !== 'PENDING') {
        const err = new Error('Bạn chỉ có thể cập nhật hoặc hủy lịch hẹn khi trạng thái đang chờ duyệt (PENDING).');
        err.statusCode = 400;
        throw err;
      }

      if (data.status) {
        const targetStatus = data.status.toUpperCase();
        if (targetStatus !== 'CANCELLED') {
          const err = new Error('Bệnh nhân chỉ được phép tự hủy lịch hẹn khám (CANCELLED).');
          err.statusCode = 400;
          throw err;
        }
        updateData.status = 'CANCELLED';
      }

      if (data.appointment_date) {
        updateData.appointment_date = new Date(data.appointment_date);
      }
      if (data.reason) {
        updateData.reason = encrypt(data.reason.trim());
      }

    } else if (user.role === 'DOCTOR') {
      if (current.doctor_id !== BigInt(user.id)) {
        const err = new Error('Bạn không có quyền chỉnh sửa lịch hẹn của bác sĩ khác.');
        err.statusCode = 403;
        throw err;
      }

      // Bác sĩ chỉ được phép đổi trạng thái khám (ví dụ: COMPLETED, CANCELLED) và cập nhật ghi chú bệnh án lâm sàng ban đầu
      if (data.status) {
        const targetStatus = data.status.toUpperCase();
        if (!['COMPLETED', 'CANCELLED'].includes(targetStatus)) {
          const err = new Error('Bác sĩ chỉ được cập nhật trạng thái lịch khám sang COMPLETED hoặc CANCELLED.');
          err.statusCode = 400;
          throw err;
        }
        updateData.status = targetStatus;
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes ? encrypt(data.notes.trim()) : null;
      }

    } else if (['RECEPTIONIST', 'ADMIN'].includes(user.role)) {
      // Lễ tân & Admin có quyền đổi giờ khám, bác sĩ khám, ghi chú và trạng thái bất kỳ (trừ khi đã COMPLETED)
      if (current.status === 'COMPLETED' && user.role !== 'ADMIN') {
        const err = new Error('Lịch khám đã hoàn thành (COMPLETED) và không thể chỉnh sửa.');
        err.statusCode = 400;
        throw err;
      }

      if (data.appointment_date) {
        updateData.appointment_date = new Date(data.appointment_date);
      }
      if (data.doctor_id) {
        const doctorId = BigInt(data.doctor_id);
        const doctorUser = await prisma.users.findUnique({
          where: { id: doctorId },
          include: { role_ref: true }
        });
        if (!doctorUser || doctorUser.role_ref?.name !== 'DOCTOR') {
          const err = new Error('Bác sĩ được chọn không hợp lệ.');
          err.statusCode = 400;
          throw err;
        }
        updateData.doctor_id = doctorId;
      }
      if (data.status) {
        updateData.status = data.status.toUpperCase();
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes ? encrypt(data.notes.trim()) : null;
      }
      if (data.reason !== undefined) {
        updateData.reason = data.reason ? encrypt(data.reason.trim()) : null;
      }
    }

    // Kiểm tra trùng lịch hẹn khám của bác sĩ (khoảng cách 30 phút)
    const finalDoctorId = updateData.doctor_id !== undefined ? updateData.doctor_id : current.doctor_id;
    const finalDate = updateData.appointment_date !== undefined ? updateData.appointment_date : current.appointment_date;
    const targetStatus = updateData.status !== undefined ? updateData.status : current.status;

    if (['PENDING', 'CONFIRMED'].includes(targetStatus)) {
      const isDoctorOrDateChanged = 
        (updateData.doctor_id !== undefined && updateData.doctor_id !== current.doctor_id) ||
        (updateData.appointment_date !== undefined && updateData.appointment_date.getTime() !== current.appointment_date.getTime());
      
      const isStatusActivating = updateData.status !== undefined && !['PENDING', 'CONFIRMED'].includes(current.status);

      if (isDoctorOrDateChanged || isStatusActivating) {
        const minDate = new Date(finalDate.getTime() - 30 * 60 * 1000);
        const maxDate = new Date(finalDate.getTime() + 30 * 60 * 1000);

        const collision = await prisma.appointments.findFirst({
          where: {
            id: { not: appointmentId },
            doctor_id: finalDoctorId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            appointment_date: {
              gte: minDate,
              lte: maxDate
            }
          }
        });

        if (collision) {
          const err = new Error('Bác sĩ đã có lịch hẹn khác trong khoảng thời gian này (trùng lịch trong vòng 30 phút).');
          err.statusCode = 400;
          throw err;
        }
      }
    }

    updateData.updated_at = getCurrentTime();

    const updated = await prisma.appointments.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: true,
        doctor: { include: { role_ref: true } },
      },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: updated.patient_id,
      action: 'UPDATE',
      entity_type: 'appointments',
      entity_id: updated.id,
      ip_address: ipAddress,
      old_value: oldVal,
      new_value: updated,
    });

    // 1. Tự động tạo bệnh án nháp nếu trạng thái chuyển sang COMPLETED
    let draftRecordId = null;
    if (updated.status === 'COMPLETED' && current.status !== 'COMPLETED') {
      try {
        const recordCode = await generateRecordCode(prisma);
        const draftRecord = await prisma.medical_records.create({
          data: {
            record_code: recordCode,
            patient_id: updated.patient_id,
            doctor_id: updated.doctor_id,
            symptoms: updated.reason ? updated.reason : null, // Triệu chứng lấy từ lý do khám (đã mã hóa)
            diagnosis: data.diagnosis ? encrypt(data.diagnosis.trim()) : encrypt('Chưa có chẩn đoán (Tự động từ lịch hẹn)'),
            conclusion: updated.notes ? updated.notes : null, // Kết luận lấy từ ghi chú khám (đã mã hóa)
            visit_date: new Date(),
            status: 'OPEN',
          },
        });
        draftRecordId = draftRecord.id.toString();

        // Ghi audit log cho bệnh án nháp mới lập
        await prisma.audit_logs.create({
          data: {
            user_id: user.id ? BigInt(user.id) : null,
            patient_id: updated.patient_id ? BigInt(updated.patient_id) : null,
            action: 'CREATE',
            entity_type: 'medical_records',
            entity_id: draftRecord.id,
            ip_address: ipAddress || '127.0.0.1',
          },
        });
      } catch (err) {
        console.error('[Auto Draft Record Creation Failed]', err);
      }
    }

    // 2. Gửi email thông báo trạng thái nếu thay đổi sang CONFIRMED hoặc CANCELLED
    if (updated.status !== current.status && ['CONFIRMED', 'CANCELLED'].includes(updated.status)) {
      if (updated.patient?.email) {
        EmailService.sendAppointmentStatusEmail(updated.patient.email, {
          patientName: updated.patient.full_name,
          appointmentCode: updated.appointment_code,
          date: updated.appointment_date,
          status: updated.status,
          doctorName: updated.doctor?.full_name || 'Bác sĩ trực',
        }).catch((err) => {
          console.error('[Email Notification Failed]', err.message);
        });
      }
    }

    const serialized = AppointmentService.serialize(updated);
    if (draftRecordId) {
      serialized.medical_record_id = draftRecordId;
    }
    return serialized;
  },

  /**
   * Xóa lịch hẹn (DELETE) - Chỉ dành cho ADMIN.
   */
  async delete(id, user, ipAddress) {
    const appointmentId = BigInt(id);

    const current = await prisma.appointments.findUnique({
      where: { id: appointmentId },
    });

    if (!current) {
      const err = new Error('Không tìm thấy lịch khám.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.appointments.delete({
      where: { id: appointmentId },
    });

    // Ghi audit log
    await logAudit({
      user_id: user.id,
      patient_id: current.patient_id,
      action: 'DELETE',
      entity_type: 'appointments',
      entity_id: current.id,
      ip_address: ipAddress,
      old_value: current,
    });

    return { message: 'Xóa lịch khám thành công.' };
  },

  /**
   * Lấy danh sách tất cả bác sĩ trong hệ thống (Quyền truy cập mở rộng).
   */
  async getDoctors() {
    const doctors = await prisma.users.findMany({
      where: {
        role_ref: {
          name: 'DOCTOR',
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        full_name: true,
        email: true,
      },
    });

    return doctors.map((d) => ({
      id: d.id.toString(),
      full_name: d.full_name,
      email: d.email,
    }));
  },

  /**
   * Chuẩn hóa dữ liệu BigInt sang String để serialize sang JSON.
   */
  serialize(appointment) {
    if (!appointment) return null;
    const serialized = {
      ...appointment,
      id: appointment.id.toString(),
      patient_id: appointment.patient_id.toString(),
      doctor_id: appointment.doctor_id.toString(),
      reason: appointment.reason ? decrypt(appointment.reason) : null,
      notes: appointment.notes ? decrypt(appointment.notes) : null,
    };

    if (appointment.patient) {
      serialized.patient = {
        ...appointment.patient,
        id: appointment.patient.id.toString(),
        created_by: appointment.patient.created_by?.toString() || null,
        user_id: appointment.patient.user_id?.toString() || null,
      };
    }

    if (appointment.doctor) {
      serialized.doctor = {
        id: appointment.doctor.id.toString(),
        username: appointment.doctor.username,
        email: appointment.doctor.email,
        full_name: appointment.doctor.full_name,
        role: appointment.doctor.role_ref?.name ?? null,
      };
    }

    return serialized;
  },
};

module.exports = AppointmentService;
