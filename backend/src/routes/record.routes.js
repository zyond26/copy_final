const express = require('express');
const router = express.Router();
const RecordController = require('../controllers/record.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const { validateCreateRecord, validateUpdateRecord } = require('../validators/record.validator');

/**
 * @swagger
 * tags:
 *   name: Medical Records
 *   description: Quản lý bệnh án điện tử (BA-01 → BA-05)
 */

// Tất cả các route đều yêu cầu đăng nhập
router.use(authenticate);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Tạo bệnh án mới (BA-01)
 *     description: Bác sĩ điều trị tạo bệnh án mới cho bệnh nhân, ghi nhận triệu chứng và chẩn đoán.
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - diagnosis
 *             properties:
 *               patient_id:
 *                 type: string
 *                 example: "1"
 *               symptoms:
 *                 type: string
 *                 example: "Ho khan kéo dài, sốt nhẹ 38 độ C"
 *               diagnosis:
 *                 type: string
 *                 example: "Viêm phế quản cấp"
 *               conclusion:
 *                 type: string
 *                 example: "Cho uống thuốc theo đơn và nghỉ ngơi 3 ngày"
 *               visit_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-07T06:30:00.000Z"
 *     responses:
 *       201:
 *         description: Tạo bệnh án thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Quyền truy cập bị từ chối (Chỉ Doctor)
 */
router.post('/', authorize('record:create'), validate(validateCreateRecord), RecordController.create);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Lấy danh sách toàn bộ bệnh án (Phân trang)
 *     description: Nhân viên y tế hoặc quản trị viên xem danh sách bệnh án trong hệ thống.
 *     tags: [Medical Records]
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
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       403:
 *         description: Quyền truy cập bị từ chối (Admin, Doctor, Nurse)
 */
router.get('/', authorize('record:list', 'record:read'), RecordController.findAll);

/**
 * @swagger
 * /api/records/patient/{patientId}:
 *   get:
 *     summary: Xem danh sách bệnh án của bệnh nhân (BA-02)
 *     description: Bác sĩ/Điều dưỡng/Bệnh nhân xem danh sách bệnh án của bệnh nhân theo phân quyền (Bệnh nhân chỉ xem được của chính mình).
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bệnh nhân
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       403:
 *         description: Không có quyền truy cập bệnh án của người khác
 */
router.get('/patient/:patientId', authorize('record:read'), (req, res, next) => {
  req.query.patient_id = req.params.patientId;
  RecordController.findAll(req, res, next);
});

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Xem chi tiết bệnh án (BA-02)
 *     description: Bác sĩ/Điều dưỡng/Bệnh nhân xem chi tiết bệnh án cụ thể (Bệnh nhân chỉ xem được bệnh án của chính mình).
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh án
 *     responses:
 *       200:
 *         description: Trả về thông tin chi tiết bệnh án kèm sinh hiệu và đơn thuốc
 *       404:
 *         description: Không tìm thấy bệnh án
 *       403:
 *         description: Không có quyền xem bệnh án này
 */
router.get('/:id', authorize('record:read'), RecordController.findById);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Cập nhật nội dung bệnh án (BA-03)
 *     description: Bác sĩ cập nhật nội dung bệnh án (chỉ bác sĩ tạo bệnh án này mới được sửa). Phiên bản cũ tự động được sao lưu vào lịch sử.
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh án
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diagnosis
 *             properties:
 *               symptoms:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               conclusion:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền sửa (chỉ bác sĩ lập bệnh án được quyền sửa)
 *       404:
 *         description: Không tìm thấy bệnh án
 */
router.put('/:id', authorize('record:update'), validate(validateUpdateRecord), RecordController.update);

/**
 * @swagger
 * /api/records/{id}/history:
 *   get:
 *     summary: Xem lịch sử bệnh án (BA-04)
 *     description: Xem tất cả các phiên bản cũ của bệnh án (audit trail).
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh án
 *     responses:
 *       200:
 *         description: Danh sách lịch sử các phiên bản cũ của bệnh án
 *       404:
 *         description: Không tìm thấy bệnh án
 */
router.get('/:id/history', authorize('record:read'), RecordController.findHistory);

/**
 * @swagger
 * /api/records/{id}/pdf:
 *   get:
 *     summary: In bệnh án / Xuất PDF (BA-05)
 *     description: Tải xuống file PDF bệnh án (Bệnh nhân chỉ tải được bệnh án của chính mình).
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh án
 *     responses:
 *       200:
 *         description: Trả về file PDF nhị phân
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Không tìm thấy bệnh án
 */
router.get('/:id/pdf', authorize('record:read'), RecordController.exportPDF);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Xóa bệnh án (Admin only)
 *     description: Xóa hoàn toàn một bệnh án khỏi hệ thống.
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh án
 *     responses:
 *       200:
 *         description: Xóa bệnh án thành công
 *       403:
 *         description: Quyền truy cập bị từ chối
 *       404:
 *         description: Không tìm thấy bệnh án
 */
router.delete('/:id', authorize('record:delete'), RecordController.delete);

module.exports = router;
