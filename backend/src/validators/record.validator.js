/**
 * Validate request body for creating a medical record (BA-01).
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateCreateRecord = (body) => {
  const errors = [];

  if (!body.patient_id) {
    errors.push('patient_id (ID bệnh nhân) là bắt buộc.');
  }

  if (!body.diagnosis || typeof body.diagnosis !== 'string' || body.diagnosis.trim().length === 0) {
    errors.push('diagnosis (chẩn đoán) là bắt buộc và không được để trống.');
  }

  if (body.visit_date && isNaN(Date.parse(body.visit_date))) {
    errors.push('visit_date phải là một định dạng ngày hợp lệ.');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate request body for updating a medical record (BA-03).
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateUpdateRecord = (body) => {
  const errors = [];

  if (!body.diagnosis || typeof body.diagnosis !== 'string' || body.diagnosis.trim().length === 0) {
    errors.push('diagnosis (chẩn đoán) là bắt buộc và không được để trống.');
  }

  if (body.status && !['OPEN', 'CLOSED'].includes(body.status.toUpperCase())) {
    errors.push('status phải là một trong: OPEN, CLOSED.');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateCreateRecord,
  validateUpdateRecord,
};
