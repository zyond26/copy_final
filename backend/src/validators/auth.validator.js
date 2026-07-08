/**
 * Auth Validator – validate request body cho các API authentication.
 */

/**
 * Kiểm tra độ mạnh của mật khẩu.
 * Yêu cầu: 8–15 ký tự, có chữ cái, có số và có ký tự đặc biệt.
 * @param {*} password
 * @param {string} fieldName - tên trường hiển thị trong thông báo lỗi
 * @returns {string[]} danh sách lỗi (rỗng nếu hợp lệ)
 */
const validatePasswordStrength = (password, fieldName = 'password') => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    errors.push(`${fieldName} là bắt buộc.`);
    return errors;
  }

  if (password.length < 8 || password.length > 15) {
    errors.push(`${fieldName} phải có độ dài từ 8 đến 15 ký tự.`);
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push(`${fieldName} phải chứa ít nhất một chữ cái.`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push(`${fieldName} phải chứa ít nhất một chữ hoa.`);
  }
  if (!/[0-9]/.test(password)) {
    errors.push(`${fieldName} phải chứa ít nhất một chữ số.`);
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push(`${fieldName} phải chứa ít nhất một ký tự đặc biệt.`);
  }

  return errors;
};

const validateRegister = (body) => {
  const errors = [];

  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('email là bắt buộc và phải đúng định dạng.');
  }

  errors.push(...validatePasswordStrength(body.password, 'password'));

  if (!body.full_name || typeof body.full_name !== 'string' || body.full_name.trim().length < 2) {
    errors.push('full_name là bắt buộc và phải có ít nhất 2 ký tự.');
  }

  if (!body.username || typeof body.username !== 'string' || body.username.trim().length < 3) {
    errors.push('username là bắt buộc và phải có ít nhất 3 ký tự.');
  }

  if (!body.citizen_id || typeof body.citizen_id !== 'string' || !/^\d{12}$/.test(body.citizen_id.trim())) {
    errors.push('citizen_id là bắt buộc và phải gồm đúng 12 chữ số.');
  }

  if (!body.dob || typeof body.dob !== 'string' || isNaN(Date.parse(body.dob))) {
    errors.push('dob (ngày sinh) là bắt buộc và phải đúng định dạng ngày hợp lệ.');
  }

  const validGenders = ['MALE', 'FEMALE', 'OTHER'];
  if (!body.gender || typeof body.gender !== 'string' || !validGenders.includes(body.gender.toUpperCase())) {
    errors.push('gender (giới tính) là bắt buộc và phải là MALE, FEMALE hoặc OTHER.');
  }

  if (!body.phone || typeof body.phone !== 'string' || !/^\d{9,15}$/.test(body.phone.trim())) {
    errors.push('phone (số điện thoại) là bắt buộc và phải từ 9 đến 15 chữ số.');
  }

  if (!body.address || typeof body.address !== 'string' || body.address.trim().length < 3) {
    errors.push('address (địa chỉ) là bắt buộc và phải có ít nhất 3 ký tự.');
  }

  return { isValid: errors.length === 0, errors };
};

const validateLogin = (body) => {
  const errors = [];

  if (!body.email || typeof body.email !== 'string') {
    errors.push('email là bắt buộc.');
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push('password là bắt buộc.');
  }

  return { isValid: errors.length === 0, errors };
};

const validateVerifyEmail = (body) => {
  const errors = [];

  if (!body.email || typeof body.email !== 'string') {
    errors.push('email là bắt buộc.');
  }

  if (!body.otp_code || typeof body.otp_code !== 'string' || body.otp_code.length !== 6) {
    errors.push('otp_code là bắt buộc và phải có đúng 6 chữ số.');
  }

  return { isValid: errors.length === 0, errors };
};

const validateVerifyMfa = (body) => {
  const errors = [];

  if (!body.otp_code || typeof body.otp_code !== 'string' || body.otp_code.length !== 6) {
    errors.push('otp_code là bắt buộc và phải có đúng 6 chữ số.');
  }

  return { isValid: errors.length === 0, errors };
};

const validateChangePassword = (body) => {
  const errors = [];

  if (!body.current_password || typeof body.current_password !== 'string') {
    errors.push('current_password là bắt buộc.');
  }

  errors.push(...validatePasswordStrength(body.new_password, 'new_password'));

  if (body.current_password && body.new_password && body.current_password === body.new_password) {
    errors.push('Mật khẩu mới phải khác mật khẩu hiện tại.');
  }

  return { isValid: errors.length === 0, errors };
};

const validateForgotPassword = (body) => {
  const errors = [];

  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('email là bắt buộc và phải đúng định dạng.');
  }

  return { isValid: errors.length === 0, errors };
};

const validateResetPassword = (body) => {
  const errors = [];

  if (!body.email || typeof body.email !== 'string') {
    errors.push('email là bắt buộc.');
  }

  if (!body.otp_code || typeof body.otp_code !== 'string' || body.otp_code.length !== 6) {
    errors.push('otp_code là bắt buộc và phải có đúng 6 chữ số.');
  }

  errors.push(...validatePasswordStrength(body.new_password, 'new_password'));

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validatePasswordStrength,
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateVerifyMfa,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
};
