const RecordService = require('../services/record.service');
const { generateMedicalRecordPDF } = require('../services/pdf.service');
const { success } = require('../utils/response');

/**
 * Record Controller – thin layer that routes HTTP requests to services.
 */
const RecordController = {
  /**
   * POST /api/records
   * Tạo bệnh án mới (BA-01).
   */
  async create(req, res, next) {
    try {
      const record = await RecordService.create(req.body, req.user, req.ip);
      return success(res, record, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/records/:id
   * Cập nhật bệnh án (BA-03).
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const record = await RecordService.update(id, req.body, req.user, req.ip);
      return success(res, record, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/records/:id
   * Lấy chi tiết bệnh án (BA-02).
   */
  async findById(req, res, next) {
    try {
      const { id } = req.params;
      const breakGlassReason = req.query.break_glass_reason || req.headers['x-break-glass-reason'] || null;
      const record = await RecordService.findById(id, req.user, req.ip, breakGlassReason);
      return success(res, record, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/records
   * Lấy danh sách bệnh án (Có phân trang).
   */
  async findAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const patientId = req.query.patient_id || req.params.patientId || null;

      const result = await RecordService.findAll(page, limit, patientId, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/records/:id/history
   * Xem lịch sử phiên bản của bệnh án (BA-04).
   */
  async findHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await RecordService.findHistory(id, req.user, req.ip);
      return success(res, history, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/records/:id/pdf
   * Xuất bệnh án ra file PDF (BA-05).
   */
  async exportPDF(req, res, next) {
    try {
      const { id } = req.params;
      const breakGlassReason = req.query.break_glass_reason || req.headers['x-break-glass-reason'] || null;
      // 1. Lấy chi tiết bệnh án đầy đủ thông tin (đã kiểm tra phân quyền nội bộ)
      const record = await RecordService.findById(id, req.user, req.ip, breakGlassReason, true);
      
      // 2. Sinh file PDF
      const pdfBuffer = await generateMedicalRecordPDF(record);

      // 3. Trả về stream file PDF cho client download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=EMR-${record.record_code}.pdf`);
      return res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/records/:id
   * Xóa bệnh án (Chỉ Admin).
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await RecordService.delete(id, req.user, req.ip);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = RecordController;
