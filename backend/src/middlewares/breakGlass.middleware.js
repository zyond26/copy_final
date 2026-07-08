const prisma = require('../config/prisma');
const { getCurrentTime } = require('../utils/time');

const checkBreakGlassAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const patientId = req.params.id || req.params.patientId || req.body.patient_id;

    if (!userId || !patientId) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu thông tin người dùng hoặc bệnh nhân'
      });
    }

    // 1. Admin được phép truy cập tất cả
    if (role === 'ADMIN') {
      return next();
    }

    // 2. Kiểm tra có Break Glass đang active không
    const activeBreakGlass = await prisma.break_glass.findFirst({
      where: {
        requested_by: userId,
        patient_id: BigInt(patientId),
        status: 'APPROVED',
        expires_at: {
          gte: getCurrentTime() // Chưa hết hạn
        }
      }
    });

    if (activeBreakGlass) {
      // Ghi nhận đây là truy cập qua Break Glass (nếu cần log)
      req.breakGlassAccess = true;
      return next();
    }

    // 3. Kiểm tra nếu user là chủ sở hữu bệnh nhân (nếu có liên kết user_id trong bảng patients)
    const patient = await prisma.patients.findUnique({
      where: { id: BigInt(patientId) },
      select: { user_id: true }
    });

    if (patient && patient.user_id === userId) {
      return next();
    }

    // Nếu không thuộc các trường hợp trên → từ chối
    return res.status(403).json({
      status: 'error',
      message: 'Bạn không có quyền truy cập hồ sơ bệnh nhân này'
    });
  } catch (error) {
    console.error('Break Glass Middleware Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi kiểm tra quyền truy cập'
    });
  }
};

module.exports = checkBreakGlassAccess;