const express = require('express');
const router = express.Router();
const BreakGlassController = require('../controllers/breakGlass.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Break Glass
 *   description: Quản lý Break Glass - Truy cập khẩn cấp (ISO 27799)
 */

/**
 * @swagger
 * /api/break-glass:
 *   post:
 *     summary: Yêu cầu Break Glass (Emergency Access)
 *     description: >
 *       Bác sĩ hoặc nhân viên y tế gửi yêu cầu truy cập khẩn cấp hồ sơ bệnh nhân
 *       khi có tình huống khẩn cấp và không thể chờ phê duyệt thông thường.
 *     tags: [Break Glass]
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
 *               - reason
 *             properties:
 *               patient_id:
 *                 type: integer
 *                 example: 123
 *               reason:
 *                 type: string
 *                 example: "Bệnh nhân đang nguy kịch, cần truy cập ngay hồ sơ y tế để cấp cứu"
 *     responses:
 *       201:
 *         description: Yêu cầu Break Glass đã được tạo thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       403:
 *         description: Không có quyền thực hiện chức năng này
 */
router.post('/', authenticate, authorize('breakglass:request'), BreakGlassController.requestBreakGlass);

/**
 * @swagger
 * /api/break-glass:
 *   get:
 *     summary: Lấy danh sách yêu cầu Break Glass
 *     description: >
 *       Admin xem danh sách các yêu cầu Break Glass theo trạng thái (PENDING, APPROVED, REJECTED).
 *       Hỗ trợ lọc theo patient_id.
 *     tags: [Break Glass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, EXPIRED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: integer
 *         description: Lọc theo ID bệnh nhân
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu Break Glass
 */
router.get('/', authenticate, authorize('breakglass:manage'), BreakGlassController.getBreakGlassRequests);

/**
 * @swagger
 * /api/break-glass/{id}/approve:
 *   patch:
 *     summary: Phê duyệt yêu cầu Break Glass
 *     description: >
 *       Admin phê duyệt yêu cầu truy cập khẩn cấp. Sau khi phê duyệt, người yêu cầu
 *       có quyền truy cập hồ sơ bệnh nhân trong thời gian quy định (mặc định 30 phút).
 *     tags: [Break Glass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của yêu cầu Break Glass
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
router.patch('/:id/approve', authenticate, authorize('breakglass:manage'), BreakGlassController.approveRequest);

/**
 * @swagger
 * /api/break-glass/{id}/reject:
 *   patch:
 *     summary: Từ chối yêu cầu Break Glass
 *     description: >
 *       Admin từ chối yêu cầu truy cập khẩn cấp. Yêu cầu sẽ không còn hiệu lực.
 *     tags: [Break Glass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của yêu cầu Break Glass
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
router.patch('/:id/reject', authenticate, authorize('breakglass:manage'), BreakGlassController.rejectRequest);

/**
 * @swagger
 * /api/break-glass/access/{patientId}:
 *   get:
 *     summary: Kiểm tra quyền truy cập khẩn cấp (Break Glass)
 *     description: >
 *       Kiểm tra xem người dùng hiện tại có quyền truy cập khẩn cấp hồ sơ bệnh nhân
 *       thông qua Break Glass đã được phê duyệt và còn hạn hay không.
 *     tags: [Break Glass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bệnh nhân
 *     responses:
 *       200:
 *         description: Có quyền truy cập khẩn cấp
 *       403:
 *         description: Không có quyền hoặc đã hết hạn
 */
router.get('/access/:patientId', authenticate, BreakGlassController.accessWithBreakGlass);

module.exports = router;