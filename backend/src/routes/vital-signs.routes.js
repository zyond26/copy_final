const express = require('express');
const router = express.Router();
const VitalSignsController = require('../controllers/vital-signs.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: VitalSigns
 *   description: Quản lý sinh hiệu bệnh nhân (SH-01, SH-02, SH-03)
 */

// Tất cả các routes sinh hiệu đều yêu cầu đăng nhập
router.use(authenticate);

/**
 * @swagger
 * /api/vital-signs:
 *   post:
 *     summary: Ghi nhận sinh hiệu mới (SH-01)
 *     description: |
 *       Điều dưỡng ghi nhận sinh hiệu cho bệnh nhân theo bệnh án.
 *       `blood_pressure` nhập dạng chuỗi "systolic/diastolic", ví dụ: "120/80".
 *       Kết quả trả về bao gồm `is_abnormal` và `alerts` (SH-03 – cảnh báo bất thường).
 *     tags: [VitalSigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medical_record_id
 *             properties:
 *               medical_record_id:
 *                 type: string
 *                 description: ID bệnh án (bắt buộc)
 *                 example: "1"
 *               temperature:
 *                 type: number
 *                 description: Nhiệt độ (°C), khoảng 30-45
 *                 example: 37.5
 *               blood_pressure:
 *                 type: string
 *                 description: Huyết áp dạng "systolic/diastolic" (mmHg)
 *                 example: "120/80"
 *               heart_rate:
 *                 type: integer
 *                 description: Nhịp tim (bpm)
 *                 example: 78
 *               spo2:
 *                 type: integer
 *                 description: SpO2 (%), khoảng 0-100
 *                 example: 98
 *               weight:
 *                 type: number
 *                 description: Cân nặng (kg)
 *                 example: 65.5
 *               note:
 *                 type: string
 *                 description: Ghi chú thêm
 *                 example: "Bệnh nhân có vẻ mệt mỏi"
 *     responses:
 *       201:
 *         description: Ghi nhận thành công, kèm cảnh báo bất thường nếu có
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền (Yêu cầu vai trò NURSE)
 *       404:
 *         description: Không tìm thấy bệnh án
 */
router.post('/', authorize('vital:create'), VitalSignsController.create);
router.get('/', authorize('vital:read'), VitalSignsController.findAll);

/**
 * @swagger
 * /api/vital-signs/patient/{patientId}:
 *   get:
 *     summary: Lấy lịch sử sinh hiệu theo bệnh nhân
 *     description: Tra cứu toàn bộ sinh hiệu của bệnh nhân qua tất cả các bệnh án.
 *     tags: [VitalSigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân
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
 *         description: Danh sách sinh hiệu có phân trang
 *       403:
 *         description: Không có quyền xem của người khác (PATIENT)
 */
router.get('/patient/:patientCode', authorize('vital:read'), VitalSignsController.findByPatient);

/**
 * @swagger
 * /api/vital-signs/chart/{patientId}:
 *   get:
 *     summary: Lấy dữ liệu biểu đồ sinh hiệu (SH-02)
 *     description: |
 *       Trả về danh sách sinh hiệu trong N ngày gần nhất, sắp xếp tăng dần theo thời gian.
 *       Kết quả bổ sung `bp_systolic` và `bp_diastolic` parse từ `blood_pressure` để tiện vẽ biểu đồ.
 *     tags: [VitalSigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Số ngày gần nhất cần lấy dữ liệu
 *     responses:
 *       200:
 *         description: Dữ liệu biểu đồ theo thời gian
 */
router.get('/chart/:patientCode', authorize('vital:read'), VitalSignsController.getChartData);

/**
 * @swagger
 * /api/vital-signs/record/{recordId}:
 *   get:
 *     summary: Lấy sinh hiệu theo bệnh án
 *     tags: [VitalSigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh án
 *     responses:
 *       200:
 *         description: Danh sách sinh hiệu của bệnh án
 *       404:
 *         description: Không tìm thấy bệnh án
 */
router.get('/record/:recordCode', authorize('vital:read'), VitalSignsController.findByRecord);

/**
 * @swagger
 * /api/vital-signs/{id}:
 *   get:
 *     summary: Lấy chi tiết một bản ghi sinh hiệu
 *     tags: [VitalSigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bản ghi sinh hiệu
 *     responses:
 *       200:
 *         description: Chi tiết sinh hiệu kèm cảnh báo bất thường
 *       404:
 *         description: Không tìm thấy bản ghi
 *   put:
 *     summary: Cập nhật sinh hiệu (SH-01)
 *     description: Điều dưỡng đã ghi hoặc Admin có thể cập nhật.
 *     tags: [VitalSigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               temperature:
 *                 type: number
 *               blood_pressure:
 *                 type: string
 *                 example: "130/85"
 *               heart_rate:
 *                 type: integer
 *               spo2:
 *                 type: integer
 *               weight:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền sửa bản ghi của người khác
 *   delete:
 *     summary: Xóa sinh hiệu (Admin only)
 *     tags: [VitalSigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy bản ghi
 */
router.get('/:id', authorize('vital:read'), VitalSignsController.findById);
router.put('/:id', authorize('vital:update'), VitalSignsController.update);
router.delete('/:id', authorize('vital:delete'), VitalSignsController.delete);

module.exports = router;
