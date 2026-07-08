const { getCurrentTime } = require('../utils/time');

/**
 * Validate the request body for creating a new appointment.
 * Required fields: doctor_id, appointment_date
 * Optional fields: patient_id, reason, notes
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateCreateAppointment = (body) => {
  const errors = [];

  // doctor_id
  if (!body.doctor_id) {
    errors.push('doctor_id (bác sĩ khám) là bắt buộc.');
  }

  // appointment_date
  if (!body.appointment_date) {
    errors.push('appointment_date (ngày giờ hẹn khám) là bắt buộc.');
  } else {
    const parseTime = Date.parse(body.appointment_date);
    if (isNaN(parseTime)) {
      errors.push('appointment_date phải là định dạng ngày giờ hợp lệ.');
    } else {
      const now = getCurrentTime();
      const appDate = new Date(body.appointment_date);
      if (appDate <= now) {
        errors.push('appointment_date phải là một thời điểm trong tương lai.');
      }
    }
  }

  // reason
  if (body.reason && (typeof body.reason !== 'string' || body.reason.trim().length === 0)) {
    errors.push('reason (lý do khám) nếu có phải là chuỗi hợp lệ.');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate updating an appointment.
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateUpdateAppointment = (body) => {
  const errors = [];
  const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

  if (body.appointment_date) {
    const parseTime = Date.parse(body.appointment_date);
    if (isNaN(parseTime)) {
      errors.push('appointment_date phải là định dạng ngày giờ hợp lệ.');
    } else {
      const now = getCurrentTime();
      const appDate = new Date(body.appointment_date);
      if (appDate <= now) {
        errors.push('appointment_date phải là một thời điểm trong tương lai.');
      }
    }
  }

  if (body.status && !VALID_STATUSES.includes(body.status.toUpperCase())) {
    errors.push(`Trạng thái status phải thuộc một trong: ${VALID_STATUSES.join(', ')}.`);
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateCreateAppointment,
  validateUpdateAppointment,
};
