/**
 * Validate đầu vào đảm bảo dữ liệu lâm sàng không rỗng
 */
const validatePrescription = (body) => {
  const errors = [];

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    errors.push('Đơn thuốc bắt buộc phải có ít nhất một mục thuốc (items).');
  } else {
    body.items.forEach((item, idx) => {
      if (!item.medicine_name || typeof item.medicine_name !== 'string' || item.medicine_name.trim() === '') {
        errors.push(`Mục thứ [${idx}]: Tên thuốc không được để trống.`);
      }
      if (item.duration_days && (isNaN(parseInt(item.duration_days)) || parseInt(item.duration_days) <= 0)) {
        errors.push(`Mục thứ [${idx}]: Số ngày uống thuốc phải là số nguyên dương lớn hơn 0.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = { validatePrescription };