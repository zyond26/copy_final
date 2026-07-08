const prisma = require('../config/prisma');
const { getCurrentTime } = require('../utils/time');

// Chống dò OTP (brute force): vô hiệu mã sau số lần nhập sai cho phép (ISO 27799 §9.4.2)
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS, 10) || 5;

/**
 * OTP Service – sinh, lưu và xác thực mã OTP.
 * Sử dụng bảng otp_verifications trong database.
 */
const OtpService = {
  /**
   * Sinh OTP 6 chữ số ngẫu nhiên, lưu vào DB.
   * Trước khi tạo mới, hủy tất cả OTP cũ chưa dùng của user.
   *
   * @param {BigInt|number} userId
   * @returns {Promise<string>} Mã OTP 6 chữ số
   */
  async generateAndSave(userId) {
    // Hủy tất cả OTP cũ chưa verify
    await prisma.otp_verifications.updateMany({
      where: {
        user_id: BigInt(userId),
        verified: false,
      },
      data: {
        verified: true, // Đánh dấu đã dùng để vô hiệu hóa
      },
    });

    // Sinh OTP 6 chữ số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Tính thời gian hết hạn
    const expiresMinutes = parseInt(process.env.MFA_OTP_EXPIRES_MINUTES, 10) || 5;
    const expiredAt = new Date(getCurrentTime().getTime() + expiresMinutes * 60 * 1000);

    // Lưu vào DB
    await prisma.otp_verifications.create({
      data: {
        user_id: BigInt(userId),
        otp_code: otpCode,
        expired_at: expiredAt,
        verified: false,
      },
    });

    return otpCode;
  },

  /**
   * Xác thực OTP: kiểm tra mã đúng, chưa hết hạn, chưa dùng.
   *
   * @param {BigInt|number} userId
   * @param {string} code - Mã OTP người dùng nhập
   * @returns {Promise<boolean>} true nếu OTP hợp lệ
   */
  async verify(userId, code) {
    // Lấy mã OTP còn hiệu lực mới nhất của user (KHÔNG lọc theo code,
    // để có thể đếm số lần nhập sai trên chính mã đó).
    const otp = await prisma.otp_verifications.findFirst({
      where: {
        user_id: BigInt(userId),
        verified: false,
        expired_at: {
          gte: getCurrentTime(), // Chưa hết hạn
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!otp) {
      return false;
    }

    // Đã nhập sai quá số lần cho phép → vô hiệu hóa mã, buộc xin mã mới
    if ((otp.attempts || 0) >= MAX_OTP_ATTEMPTS) {
      await prisma.otp_verifications.update({
        where: { id: otp.id },
        data: { verified: true },
      });
      return false;
    }

    // Nhập sai → tăng bộ đếm, vô hiệu mã nếu vừa chạm ngưỡng
    if (otp.otp_code !== code) {
      const attempts = (otp.attempts || 0) + 1;
      await prisma.otp_verifications.update({
        where: { id: otp.id },
        data: {
          attempts,
          verified: attempts >= MAX_OTP_ATTEMPTS, // chạm ngưỡng thì khóa luôn mã
        },
      });
      return false;
    }

    // Nhập đúng → đánh dấu đã sử dụng
    await prisma.otp_verifications.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return true;
  },
};

module.exports = OtpService;
