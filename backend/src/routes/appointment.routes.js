const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointment.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateCreateAppointment, validateUpdateAppointment } = require('../validators/appointment.validator');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Quản lý đặt lịch khám bệnh (Tuân thủ ISO 27799)
 */

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Tạo lịch hẹn khám mới
 *     description: >
 *       Bệnh nhân tự đặt lịch khám (hệ thống tự động liên kết với bệnh nhân).
 *       Hoặc Lễ tân / Admin đặt lịch hộ bệnh nhân (yêu cầu truyền patient_id).
 *       Trạng thái mặc định ban đầu là PENDING.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - appointment_date
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 description: ID của bác sĩ khám (phải thuộc role DOCTOR)
 *                 example: "2"
 *               appointment_date:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày giờ hẹn khám (phải ở tương lai)
 *                 example: "2026-07-20T10:00:00Z"
 *               patient_id:
 *                 type: string
 *                 description: ID của bệnh nhân (bắt buộc nếu là nhân viên y tế đặt hộ)
 *                 example: "1"
 *               reason:
 *                 type: string
 *                 description: Lý do khám / triệu chứng ban đầu
 *                 example: "Đau họng, sốt nhẹ"
 *               notes:
 *                 type: string
 *                 description: Ghi chú thêm
 *                 example: "Đã khám tại phòng mạch tư trước đó"
 *     responses:
 *       201:
 *         description: Đặt lịch khám thành công
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.post('/', authenticate, authorize('appointment:create'), validate(validateCreateAppointment), AppointmentController.create);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Xem danh sách lịch khám (Phân trang và bộ lọc)
 *     description: >
 *       Xem danh sách lịch hẹn trong hệ thống.
 *       Bệnh nhân chỉ xem được lịch của chính mình.
 *       Bác sĩ chỉ xem được lịch khám được xếp cho mình.
 *       Admin/Receptionist/Nurse xem được toàn bộ hoặc lọc theo điều kiện.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi trên một trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *         description: Lọc theo trạng thái lịch
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID bác sĩ (chỉ lễ tân/admin)
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID bệnh nhân (chỉ lễ tân/admin)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc chính xác theo ngày hẹn khám (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/', authenticate, authorize('appointment:read', 'appointment:read_own'), AppointmentController.getAll);

/**
 * @swagger
 * /api/appointments/doctors:
 *   get:
 *     summary: Lấy danh sách bác sĩ đang hoạt động
 *     description: Trả về danh sách tên và email các bác sĩ để phục vụ đặt lịch hẹn.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bác sĩ
 */
router.get('/doctors', authenticate, authorize('appointment:create'), AppointmentController.getDoctors);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Lấy chi tiết lịch khám theo ID
 *     description: >
 *       Xem chi tiết lịch hẹn khám bệnh. Hiển thị mã bệnh nhân `patient_code` bắt buộc.
 *       Bệnh nhân chỉ xem được lịch của chính mình, bác sĩ xem lịch của mình, lễ tân/admin xem tất cả.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch khám
 *     responses:
 *       200:
 *         description: Lấy chi tiết lịch khám thành công
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy lịch khám
 */
router.get('/:id', authenticate, authorize('appointment:read', 'appointment:read_own'), AppointmentController.getById);

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Cập nhật thông tin lịch khám (Dành cho nhân viên y tế)
 *     description: >
 *       - Bác sĩ: cập nhật ghi chú khám note hoặc chuyển trạng thái sang COMPLETED/CANCELLED.
 *       - Lễ tân/Admin: điều phối, dời ngày hẹn khám, thay đổi bác sĩ khám hoặc phê duyệt lịch (CONFIRMED).
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-21T09:30:00Z"
 *               doctor_id:
 *                 type: string
 *                 example: "2"
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                 example: "CONFIRMED"
 *               notes:
 *                 type: string
 *                 example: "Bệnh nhân cần đến trước 15 phút để đo sinh hiệu"
 *               reason:
 *                 type: string
 *                 example: "Đau họng kéo dài kèm ho khan"
 *     responses:
 *       200:
 *         description: Cập nhật lịch khám thành công
 *       400:
 *         description: Trạng thái hoặc thông tin gửi lên không đúng luật
 */
router.put('/:id', authenticate, authorize('appointment:update'), validate(validateUpdateAppointment), AppointmentController.update);

/**
 * @swagger
 * /api/appointments/me/{id}:
 *   put:
 *     summary: Bệnh nhân tự cập nhật hoặc hủy lịch khám của mình
 *     description: Bệnh nhân chỉ được dời ngày khám hoặc hủy lịch (`CANCELLED`) khi lịch khám còn ở trạng thái `PENDING`.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám của chính mình
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-25T14:00:00Z"
 *               reason:
 *                 type: string
 *                 example: "Đổi ngày bận đột xuất"
 *               status:
 *                 type: string
 *                 enum: [CANCELLED]
 *                 example: "CANCELLED"
 *     responses:
 *       200:
 *         description: Tự cập nhật hoặc hủy lịch thành công
 *       400:
 *         description: Lịch không ở trạng thái PENDING hoặc status không phải CANCELLED
 */
router.put('/me/:id', authenticate, authorize('appointment:update_own'), validate(validateUpdateAppointment), AppointmentController.updateMe);

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Xóa lịch hẹn (Chỉ dành cho Admin)
 *     description: Xóa hoàn toàn lịch hẹn khỏi hệ thống (lệnh này được ghi nhận audit log chặt chẽ).
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch hẹn khám
 *     responses:
 *       200:
 *         description: Xóa lịch hẹn thành công
 *       403:
 *         description: Bạn không có quyền (Chỉ Admin mới được xóa)
 */
router.delete('/:id', authenticate, authorize('appointment:delete'), AppointmentController.delete);

module.exports = router;
