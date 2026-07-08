const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Áp dụng xác thực và phân quyền cho tất cả các route bên dưới
router.use(authenticate);
router.use(authorize('role:manage')); // Yêu cầu quyền role:manage

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Quản lý vai trò và quyền (Yêu cầu quyền role:manage)
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Lấy danh sách tất cả vai trò
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', RoleController.getAllRoles);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Tạo mới vai trò
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vai trò đã tồn tại
 */
router.post('/', RoleController.createRole);
/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Lấy thông tin vai trò theo ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', RoleController.getRoleById);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Cập nhật vai trò
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', RoleController.updateRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Xóa vai trò
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Không thể xóa vai trò
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:id', RoleController.deleteRole);

// Các route liên quan đến quyền (Permissions) có thể được định tuyến ở đây
// Mặc dù gọi là role.routes, nhưng nó xử lý cả permissions

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: Lấy danh sách tất cả quyền trong hệ thống
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/sys/permissions', RoleController.getAllPermissions);

module.exports = router;
