const AppointmentService = require('../services/appointment.service');
const { success } = require('../utils/response');

/**
 * Appointment Controller – Express entry point for booking/scheduling logic.
 */
const AppointmentController = {
  /**
   * POST /api/appointments
   * Đặt lịch mới.
   */
  async create(req, res, next) {
    try {
      // req.user được gán từ middleware authenticate, req.ip từ global middleware
      const appointment = await AppointmentService.create(req.body, req.user, req.ip);
      return success(res, appointment, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/appointments/:id
   * Lấy chi tiết lịch khám.
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.findById(id, req.user, req.ip);
      return success(res, appointment);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/appointments
   * Xem danh sách lịch khám.
   */
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 15;
      const filters = {
        doctor_id: req.query.doctor_id,
        patient_id: req.query.patient_id,
        status: req.query.status,
        date: req.query.date,
      };

      const result = await AppointmentService.findAll(page, limit, filters, req.user, req.ip);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/appointments/doctors
   * Lấy danh sách bác sĩ.
   */
  async getDoctors(req, res, next) {
    try {
      const doctors = await AppointmentService.getDoctors();
      return success(res, doctors);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/appointments/:id
   * Nhân viên y tế / Bác sĩ cập nhật lịch khám.
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.update(id, req.body, req.user, req.ip);
      return success(res, appointment);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/appointments/me/:id
   * Bệnh nhân tự hủy hoặc cập nhật ngày hẹn lịch của mình.
   */
  async updateMe(req, res, next) {
    try {
      const { id } = req.params;
      // Ép kiểu vai trò sang PATIENT để xử lý đúng logic tự hủy của bệnh nhân
      const patientUser = { ...req.user, role: 'PATIENT' };
      const appointment = await AppointmentService.update(id, req.body, patientUser, req.ip);
      return success(res, appointment);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/appointments/:id
   * Xóa lịch khám (Chỉ Admin).
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AppointmentService.delete(id, req.user, req.ip);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AppointmentController;
