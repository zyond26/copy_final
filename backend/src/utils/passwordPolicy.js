const { getCurrentTime } = require('./time');

// ISO 27799 §9.4.3 – mật khẩu phải được đổi định kỳ (mặc định: 3 tháng / 90 ngày)
const PASSWORD_MAX_AGE_DAYS = parseInt(process.env.PASSWORD_MAX_AGE_DAYS, 10) || 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Lấy thời điểm mật khẩu được đặt lần cuối.
 * Dùng password_changed_at; nếu null thì fallback created_at (tài khoản cũ).
 */
function getPasswordChangedAt(user) {
  return user.password_changed_at || user.created_at || new Date(0);
}

/**
 * Kiểm tra mật khẩu đã quá hạn (>= PASSWORD_MAX_AGE_DAYS).
 */
function isPasswordExpired(user) {
  const changedAt = getPasswordChangedAt(user);
  const ageMs = getCurrentTime().getTime() - new Date(changedAt).getTime();
  return ageMs >= PASSWORD_MAX_AGE_DAYS * MS_PER_DAY;
}

/**
 * Ngày hết hạn mật khẩu (changed_at + max age).
 */
function getPasswordExpiresAt(user) {
  const changedAt = getPasswordChangedAt(user);
  return new Date(new Date(changedAt).getTime() + PASSWORD_MAX_AGE_DAYS * MS_PER_DAY);
}

/**
 * Số ngày còn lại trước khi hết hạn (0 nếu đã hết hạn).
 */
function getDaysUntilExpiry(user) {
  const expiresAt = getPasswordExpiresAt(user);
  const daysLeft = Math.ceil((expiresAt.getTime() - getCurrentTime().getTime()) / MS_PER_DAY);
  return Math.max(0, daysLeft);
}

module.exports = {
  PASSWORD_MAX_AGE_DAYS,
  getPasswordChangedAt,
  isPasswordExpired,
  getPasswordExpiresAt,
  getDaysUntilExpiry,
};
