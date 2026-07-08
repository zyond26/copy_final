const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER'];

/**
 * Validate the request body for creating a new patient (BP-01).
 * Required fields: full_name, dob, gender, phone
 * Optional fields: email, address, citizen_id
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateCreatePatient = (body) => {
  const errors = [];

  if (!body.full_name || typeof body.full_name !== 'string' || body.full_name.trim().length < 2) {
    errors.push('full_name là bắt buộc và phải có ít nhất 2 ký tự.');
  }

  if (!body.dob) {
    errors.push('dob (ngày sinh) là bắt buộc.');
  } else if (isNaN(Date.parse(body.dob))) {
    errors.push('dob phải có định dạng ngày hợp lệ (YYYY-MM-DD).');
  }

  if (!body.gender) {
    errors.push('gender (giới tính) là bắt buộc.');
  } else if (!VALID_GENDERS.includes(body.gender.toUpperCase())) {
    errors.push(`gender phải là một trong: ${VALID_GENDERS.join(', ')}.`);
  }

  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 9) {
    errors.push('phone (số điện thoại) là bắt buộc và phải có ít nhất 9 chữ số.');
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateMe = (body) => {
  const errors = [];

  if (body.dob && isNaN(Date.parse(body.dob))) {
    errors.push('dob phải có định dạng ngày hợp lệ (YYYY-MM-DD).');
  }

  if (body.gender && !VALID_GENDERS.includes(body.gender.toUpperCase())) {
    errors.push(`gender phải là một trong: ${VALID_GENDERS.join(', ')}.`);
  }

  if (body.phone && (typeof body.phone !== 'string' || body.phone.trim().length < 9)) {
    errors.push('phone phải có ít nhất 9 chữ số.');
  }

  if (body.full_name && (typeof body.full_name !== 'string' || body.full_name.trim().length < 2)) {
    errors.push('full_name (họ và tên) phải có ít nhất 2 ký tự.');
  }

  if (body.username && (typeof body.username !== 'string' || body.username.trim().length < 3)) {
    errors.push('username (tên tài khoản) phải có ít nhất 3 ký tự.');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreatePatient, validateUpdateMe };
