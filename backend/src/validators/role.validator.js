/**
 * Role Validator – validate request body cho các API quản lý vai trò.
 */

const validateCreateRole = (body) => {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 50) {
    errors.push('name là bắt buộc, phải là chuỗi từ 2 đến 50 ký tự.');
  }

  if (body.description && (typeof body.description !== 'string' || body.description.length > 255)) {
    errors.push('description phải là chuỗi không quá 255 ký tự.');
  }

  if (!body.permissions || !Array.isArray(body.permissions) || body.permissions.length === 0) {
    errors.push('permissions là bắt buộc và phải là mảng chứa ít nhất một ID quyền.');
  } else {
    for (const p of body.permissions) {
      if (!Number.isInteger(p) || p <= 0) {
        errors.push('Tất cả các ID trong permissions phải là số nguyên dương.');
        break;
      }
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateRole = (body) => {
  const errors = [];

  if (body.name && (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 50)) {
    errors.push('name phải là chuỗi từ 2 đến 50 ký tự.');
  }

  if (body.description !== undefined && body.description !== null && (typeof body.description !== 'string' || body.description.length > 255)) {
    errors.push('description phải là chuỗi không quá 255 ký tự.');
  }

  if (body.permissions) {
    if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
      errors.push('permissions phải là mảng chứa ít nhất một ID quyền.');
    } else {
      for (const p of body.permissions) {
        if (!Number.isInteger(p) || p <= 0) {
          errors.push('Tất cả các ID trong permissions phải là số nguyên dương.');
          break;
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateCreateRole,
  validateUpdateRole,
};
