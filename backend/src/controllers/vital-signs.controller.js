const VitalSignsService = require('../services/vital-signs.service');
const { validateRecordVitalSigns } = require('../validators/vital-signs.validator');
const { success } = require('../utils/response');

/**
 * VitalSigns Controller – thin layer that routes HTTP requests to services.
 *
 * Schema thực tế:
 *   Không có patient_id trực tiếp; phải đi qua medical_record_id.
 *   blood_pressure là String "systolic/diastolic".
 */
const VitalSignsController = {
  /**
   * POST /api/vital-signs
   * Ghi nhận sinh hiệu mới (SH-01).
   * Body: { medical_record_id, temperature?, blood_pressure?, heart_rate?, spo2?, weight?, note? }
   */
  async create(req, res, next) {
    try {
      const { isValid, errors } = validateRecordVitalSigns(req.body);
      if (!isValid) {
        const err = new Error(errors.join(' '));
        err.statusCode = 400;
        throw err;
      }

      const result = await VitalSignsService.create(req.body, req.user, req.ip);
      return success(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/vital-signs
   * Lấy danh sách toàn bộ sinh hiệu (Có phân trang & phân quyền).
   */
  async findAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;

      const result = await VitalSignsService.findAll(page, limit, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/vital-signs/patient/:patientId
   * GET /api/vital-signs/patient/:patientCode
   * Lấy lịch sử sinh hiệu của bệnh nhân (tra qua medical_records).
   * Query: page, limit
   */
  async findByPatient(req, res, next) {
    try {
      const { patientCode } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;

      const result = await VitalSignsService.findByPatient(patientCode, page, limit, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/vital-signs/record/:recordCode
   * Lấy sinh hiệu theo bệnh án.
   */
  async findByRecord(req, res, next) {
    try {
      const { recordCode } = req.params;
      const result = await VitalSignsService.findByRecord(recordCode, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/vital-signs/:id
   * Lấy chi tiết một bản ghi sinh hiệu.
   */
  async findById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await VitalSignsService.findById(id, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/vital-signs/:id
   * Cập nhật sinh hiệu.
   * Body: { temperature?, blood_pressure?, heart_rate?, spo2?, weight?, note? }
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const result = await VitalSignsService.update(id, req.body, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/vital-signs/chart/:patientCode
   * Lấy dữ liệu biểu đồ sinh hiệu (SH-02).
   * Query: days (mặc định 30)
   */
  async getChartData(req, res, next) {
    try {
      const { patientCode } = req.params;
      const days = parseInt(req.query.days) || 30;

      const result = await VitalSignsService.getChartData(patientCode, days, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/vital-signs/:id
   * Xóa sinh hiệu (Chỉ Admin).
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await VitalSignsService.delete(id, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = VitalSignsController;
