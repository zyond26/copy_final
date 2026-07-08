const express = require('express');
const router = express.Router();
const AuditLogController = require('../controllers/auditLog.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: Báo cáo và tra cứu Audit Log (ISO 27799)
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Lấy danh sách Audit Logs (có filter + phân trang)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: entity_type
 *         schema: { type: string }
 *       - in: query
 *         name: user_id
 *         schema: { type: integer }
 *       - in: query
 *         name: patient_id
 *         schema: { type: integer }
 *       - in: query
 *         name: break_glass
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Danh sách audit logs + phân trang
 */
router.get('/', authenticate, authorize('auditlog:read'), AuditLogController.getAuditLogs);

/**
 * @swagger
 * /api/audit-logs/summary:
 *   get:
 *     summary: Báo cáo thống kê theo Action
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê số lượng theo action
 */
router.get('/summary', authenticate, authorize('auditlog:read'), AuditLogController.getAuditSummary);

/**
 * @swagger
 * /api/audit-logs/export:
 *   get:
 *     summary: Export Audit Logs ra file CSV
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File CSV
 */
router.get('/export', authenticate, authorize('auditlog:read'), AuditLogController.exportAuditLogs);

module.exports = router;