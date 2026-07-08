const express = require('express');
const router = express.Router();
const LogController = require('../controllers/log.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Tất cả các route yêu cầu đăng nhập và có quyền đọc audit log (ISO 27799 Control 9.7.1)
router.use(authenticate, authorize('auditlog:read'));

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: Quản lý và kiểm toán nhật ký hệ thống (AL-02, AL-03)
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Xem danh sách nhật ký hệ thống (AL-02)
 *     description: Admin xem toàn bộ nhật ký hệ thống (Audit Logs) để thực hiện kiểm toán bảo mật.
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Lọc logs theo ID người dùng
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Lọc logs theo hành động (CREATE, READ, UPDATE, DELETE)
 *     responses:
 *       200:
 *         description: Trả về danh sách log thành công
 *       403:
 *         description: Không có quyền truy cập (Chỉ Admin)
 */
router.get('/', LogController.findAll);

/**
 * @swagger
 * /api/logs/export:
 *   get:
 *     summary: Xuất báo cáo nhật ký hệ thống (AL-03)
 *     description: Admin tải xuống tệp tin CSV chứa thông tin audit logs để lưu trữ hoặc phân tích ngoại tuyến.
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về tệp tin CSV thành công
 *       403:
 *         description: Không có quyền truy cập (Chỉ Admin)
 */
router.get('/export', LogController.exportCSV);

module.exports = router;
