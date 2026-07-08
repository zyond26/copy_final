/**
 * User Validator – validate request body cho các API quản lý người dùng.
 */

// Lấy danh sách roles từ DB khi gán thì an toàn hơn, nhưng tạm thời Validator chỉ kiểm tra là chuỗi,
// Service/Prisma sẽ bắt lỗi nếu role không tồn tại.

const validateCreateUser = (body) => {
  const errors = [];

  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('email là bắt buộc và phải đúng định dạng.');
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    errors.push('password là bắt buộc và phải có ít nhất 8 ký tự.');
  }

  if (!body.full_name || typeof body.full_name !== 'string' || body.full_name.trim().length < 2) {
    errors.push('full_name là bắt buộc và phải có ít nhất 2 ký tự.');
  }

  if (!body.username || typeof body.username !== 'string' || body.username.trim().length < 3) {
    errors.push('username là bắt buộc và phải có ít nhất 3 ký tự.');
  }

  if (!body.role || typeof body.role !== 'string') {
    errors.push(`role là bắt buộc và phải là một chuỗi (tên vai trò).`);
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateUser = (body) => {
  const errors = [];

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('email phải đúng định dạng.');
  }

  if (body.full_name && body.full_name.trim().length < 2) {
    errors.push('full_name phải có ít nhất 2 ký tự.');
  }

  if (body.role && typeof body.role !== 'string') {
    errors.push(`role phải là một chuỗi (tên vai trò).`);
  }

  return { isValid: errors.length === 0, errors };
};

const validateAssignRole = (body) => {
  const errors = [];

  if (!body.role || typeof body.role !== 'string') {
    errors.push(`role là bắt buộc và phải là một chuỗi (tên vai trò).`);
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateAssignRole,
};
