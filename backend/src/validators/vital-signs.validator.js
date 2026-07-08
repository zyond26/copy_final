/**
 * Validate request body for recording vital signs (SH-01).
 *
 * Schema thực tế của vital_signs:
 *   - medical_record_id (required)
 *   - temperature        (optional, Decimal 4,1)
 *   - blood_pressure     (optional, String "systolic/diastolic", e.g. "120/80")
 *   - heart_rate         (optional, Int)
 *   - spo2               (optional, Int 0-100)
 *   - weight             (optional, Decimal 5,2)
 *   - note               (optional)
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateRecordVitalSigns = (body) => {
  const errors = [];

  // medical_record_id là bắt buộc
  if (!body.medical_record_id) {
    errors.push('medical_record_id (ID bệnh án) là bắt buộc.');
  }

  // temperature: số thực trong khoảng 30-45°C
  if (body.temperature !== undefined && body.temperature !== null) {
    const temp = parseFloat(body.temperature);
    if (isNaN(temp) || temp < 30 || temp > 45) {
      errors.push('temperature (nhiệt độ) phải là số trong khoảng 30-45°C.');
    }
  }

  // blood_pressure: định dạng "systolic/diastolic", ví dụ "120/80"
  if (body.blood_pressure !== undefined && body.blood_pressure !== null) {
    const bpPattern = /^(\d{1,3})\/(\d{1,3})$/;
    const match = String(body.blood_pressure).match(bpPattern);
    if (!match) {
      errors.push('blood_pressure (huyết áp) phải có định dạng "systolic/diastolic", ví dụ: "120/80".');
    } else {
      const systolic = parseInt(match[1]);
      const diastolic = parseInt(match[2]);
      if (systolic < 0 || systolic > 300) {
        errors.push('blood_pressure: huyết áp tâm thu (systolic) phải trong khoảng 0-300 mmHg.');
      }
      if (diastolic < 0 || diastolic > 300) {
        errors.push('blood_pressure: huyết áp tâm trương (diastolic) phải trong khoảng 0-300 mmHg.');
      }
    }
  }

  // heart_rate: số nguyên dương
  if (body.heart_rate !== undefined && body.heart_rate !== null) {
    const val = parseInt(body.heart_rate);
    if (isNaN(val) || val < 0 || val > 300) {
      errors.push('heart_rate (nhịp tim) phải là số nguyên dương hợp lệ (0-300 bpm).');
    }
  }

  // spo2: số nguyên 0-100
  if (body.spo2 !== undefined && body.spo2 !== null) {
    const val = parseInt(body.spo2);
    if (isNaN(val) || val < 0 || val > 100) {
      errors.push('spo2 phải là số nguyên từ 0-100 (%).');
    }
  }

  // weight: số thực dương
  if (body.weight !== undefined && body.weight !== null) {
    const val = parseFloat(body.weight);
    if (isNaN(val) || val < 0 || val > 500) {
      errors.push('weight (cân nặng) phải là số dương hợp lệ (kg).');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateRecordVitalSigns,
};
