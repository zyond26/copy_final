const PatientService = require('../services/patient.service'); // Điều chỉnh đường dẫn nếu cần
const { validateCreatePatient, validateUpdatePatient } = require('../validators/patient.validator');
const { validate } = require('../middlewares/validate');
const { success } = require('../utils/response');

/**
 * Patient Controller
 */
const PatientController = {
  /**
   * BP-01: Tạo bệnh nhân mới
   */
  async create(req, res) {
    try {
      const result = await PatientService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Tạo bệnh nhân thành công',
        data: result
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể tạo bệnh nhân'
      });
    }
  },

  /**
   * BP-03: Cập nhật bệnh nhân
   */
  async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const result = await PatientService.update(id, req.body);

      res.json({
        success: true,
        message: 'Cập nhật bệnh nhân thành công',
        data: result
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bệnh nhân'
        });
      }
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể cập nhật bệnh nhân'
      });
    }
  },

  /**
   * DELETE /api/patients/:id
   * Xóa bệnh nhân (BP-05).
   */
  async deletePatient(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientService.delete(id);
      return success(res, patient, 200);
    } catch (err) {
      next(err);
    }
  },
/**
 * GET /api/patients/search
 * Tìm kiếm bệnh nhân (BP-04)
 */
  async search(req, res, next) {
    try {
      const { q } = req.query;

      const patients = await PatientService.search(q || '');

      return success(res, patients);
    } catch (err) {
      next(err);
    }
  },
  /**
   * GET /api/patients
   * Xem danh sách bệnh nhân
   */
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;

      const result = await PatientService.findAll(page, limit);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/patients/:id
   * Xem chi tiết 1 bệnh nhân
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientService.getById(id);
      return success(res, patient);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/patients/me
   * Bệnh nhân xem profile của chính mình
   */
  async getMe(req, res, next) {
    try {
      // req.user được gán từ middleware authenticate
      const patient = await PatientService.getMe(req.user.id);
      return success(res, patient);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/patients/me
   * Bệnh nhân cập nhật thông tin cá nhân (dob, gender, phone, address)
   */
  async updateMe(req, res, next) {
    try {
      const patient = await PatientService.updateMe(req.user.id, req.body);
      return success(res, patient);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/patients/auto-merge
   * Quét và gộp tự động hồ sơ trục trặc
   */
  async autoMerge(req, res, next) {
    try {
      // req.user được gán từ middleware authenticate
      const result = await PatientService.autoMerge(req.user.id);
      res.json({
        success: true,
        message: 'Đã quét và gộp thành công các hồ sơ trùng lặp.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },
};
module.exports = PatientController;

