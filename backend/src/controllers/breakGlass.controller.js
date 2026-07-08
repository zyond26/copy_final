const prisma = require('../config/prisma');
const { getCurrentTime } = require('../utils/time');

// Yêu cầu Break Glass
exports.requestBreakGlass = async (req, res) => {
  try {
    const { patient_code, reason } = req.body;
    const userId = req.user.id;

    if (!patient_code || !reason) {
      return res.status(400).json({ status: 'error', message: 'Thiếu patient_code hoặc reason' });
    }

    const patient = await prisma.patients.findUnique({
      where: { patient_code: patient_code.trim() }
    });

    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bệnh nhân với mã đã cung cấp' });
    }

    const request = await prisma.break_glass.create({
      data: {
        requested_by: BigInt(userId),
        patient_id: patient.id,
        reason,
        status: 'PENDING',
        expires_at: new Date(getCurrentTime().getTime() + 24 * 60 * 60 * 1000)
      },
      include: {
        requester: { select: { id: true, full_name: true, role_ref: { select: { name: true } } } },
        patient: { select: { id: true, full_name: true, patient_code: true } }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Yêu cầu truy cập khẩn cấp đã được gửi',
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Gửi yêu cầu thất bại' });
  }
};

// Lấy danh sách yêu cầu Break Glass
exports.getBreakGlassRequests = async (req, res) => {
  try {
    const { status, patient_code } = req.query;
    const where = {};
    if (status) where.status = status;
    if (patient_code) {
      const patient = await prisma.patients.findUnique({
        where: { patient_code: patient_code.trim() }
      });
      if (patient) {
        where.patient_id = patient.id;
      } else {
        where.patient_id = -1n;
      }
    }

    if (req.user.role === 'DOCTOR') {
      // Find all patients where this doctor has created at least one medical record
      const doctorRecords = await prisma.medical_records.findMany({
        where: { doctor_id: BigInt(req.user.id) },
        select: { patient_id: true }
      });
      const patientIds = Array.from(new Set(doctorRecords.map(r => r.patient_id)));
      where.patient_id = { in: patientIds };
    }

    const requests = await prisma.break_glass.findMany({
      where,
      include: {
        requester: { select: { id: true, full_name: true, role_ref: { select: { name: true } } } },
        approver: { select: { id: true, full_name: true } },
        patient: { select: { id: true, full_name: true, patient_code: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ status: 'success', data: requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách' });
  }
};

// Phê duyệt Break Glass
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const request = await prisma.break_glass.findUnique({
      where: { id: BigInt(id) },
    });

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu Break Glass' });
    }

    // Checking permission to approve:
    // If not Admin, user must be a DOCTOR who has created at least one medical record for this patient
    if (role !== 'ADMIN') {
      const record = await prisma.medical_records.findFirst({
        where: {
          patient_id: request.patient_id,
          doctor_id: BigInt(userId)
        }
      });
      if (!record) {
        return res.status(403).json({
          status: 'error',
          message: 'Bạn không có quyền phê duyệt yêu cầu này (Chỉ bác sĩ điều trị của bệnh nhân mới có quyền phê duyệt)'
        });
      }
    }

    const updated = await prisma.break_glass.update({
      where: { id: BigInt(id) },
      data: {
        status: 'APPROVED',
        approved_by: BigInt(userId),
        approved_at: getCurrentTime(),
        expires_at: new Date(getCurrentTime().getTime() + 30 * 60 * 1000)
      }
    });

    res.json({
      status: 'success',
      message: 'Đã phê duyệt yêu cầu Break Glass',
      data: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Phê duyệt thất bại' });
  }
};

// Từ chối Break Glass
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const request = await prisma.break_glass.findUnique({
      where: { id: BigInt(id) },
    });

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu Break Glass' });
    }

    // Checking permission to reject
    if (role !== 'ADMIN') {
      const record = await prisma.medical_records.findFirst({
        where: {
          patient_id: request.patient_id,
          doctor_id: BigInt(userId)
        }
      });
      if (!record) {
        return res.status(403).json({
          status: 'error',
          message: 'Bạn không có quyền từ chối yêu cầu này (Chỉ bác sĩ điều trị của bệnh nhân mới có quyền từ chối)'
        });
      }
    }

    const updated = await prisma.break_glass.update({
      where: { id: BigInt(id) },
      data: { status: 'REJECTED', approved_by: BigInt(userId), approved_at: getCurrentTime() }
    });

    res.json({
      status: 'success',
      message: 'Đã từ chối yêu cầu Break Glass',
      data: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Từ chối thất bại' });
  }
};

// Kiểm tra quyền truy cập khẩn cấp
exports.accessWithBreakGlass = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    const validRequest = await prisma.break_glass.findFirst({
      where: {
        requested_by: BigInt(userId),
        patient_id: BigInt(patientId),
        status: 'APPROVED',
        expires_at: { gte: getCurrentTime() }
      }
    });

    if (!validRequest) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền truy cập khẩn cấp hoặc đã hết hạn'
      });
    }

    res.json({
      status: 'success',
      message: 'Truy cập khẩn cấp được phép',
      data: { expires_at: validRequest.expires_at }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Lỗi khi kiểm tra quyền' });
  }
};