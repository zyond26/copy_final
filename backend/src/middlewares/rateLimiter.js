/**
 * Rate limiting middleware – chống tấn công Brute Force (ISO 27799 §9.4.2).
 *
 * Giới hạn số request đến các endpoint nhạy cảm theo địa chỉ IP trong một
 * khoảng thời gian. Khi vượt ngưỡng, trả về HTTP 429 (Too Many Requests).
 */
const rateLimit = require('express-rate-limit');

// Định dạng thông báo lỗi đồng nhất với phần còn lại của hệ thống.
const buildHandler = (message) => (_req, res) => {
  res.status(429).json({ status: 'error', message });
};

/**
 * Giới hạn chung cho toàn bộ nhóm /api/auth (lớp phòng thủ rộng).
 * 30 request / 15 phút / IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.'),
});

/**
 * Giới hạn nghiêm ngặt cho các thao tác dễ bị dò mật khẩu / dò OTP:
 * đăng nhập, xác thực MFA, quên/đặt lại mật khẩu, xác thực email.
 * 5 request / 15 phút / IP. Lần thành công không tính vào hạn mức.
 */
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.'),
});

module.exports = { authLimiter, sensitiveLimiter };
