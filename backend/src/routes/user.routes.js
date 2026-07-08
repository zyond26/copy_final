const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const { validateCreateUser, validateUpdateUser, validateAssignRole } = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý người dùng (Admin only) – ND-01, ND-03
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Tất cả route trong nhóm này yêu cầu đăng nhập + quyền quản lý người dùng
router.use(authenticate, authorize('user:manage'));

// ─── CRUD Users ─────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     description: Admin xem danh sách tất cả người dùng trong hệ thống (phân trang).
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (chỉ Admin)
 */
router.get('/', UserController.findAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy chi tiết người dùng
 *     description: Admin xem thông tin chi tiết một người dùng.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       404:
 *         description: Người dùng không tồn tại
 */
router.get('/:id', UserController.findById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo người dùng mới (ND-01 - Admin)
 *     description: >
 *       Admin tạo tài khoản cho nhân viên y tế (bác sĩ, điều dưỡng, lễ tân).
 *       Tài khoản được tạo với trạng thái ACTIVE, không cần xác thực email.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *               - username
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "bacsi.nguyen@hospital.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "matkhau123"
 *               full_name:
 *                 type: string
 *                 example: "BS. Nguyễn Văn B"
 *               username:
 *                 type: string
 *                 example: "bs.nguyenvanb"
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT]
 *                 example: "DOCTOR"
 *               citizen_id:
 *                 type: string
 *                 example: "079090012345"
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email hoặc username đã tồn tại
 */
router.post('/', validate(validateCreateUser), UserController.create);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     description: Admin cập nhật thông tin người dùng (tên, email, role, status...).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PENDING, LOCKED]
 *               citizen_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Người dùng không tồn tại
 */
router.put('/:id', validate(validateUpdateUser), UserController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa người dùng
 *     description: Admin xóa tài khoản người dùng.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Người dùng không tồn tại
 */
router.delete('/:id', UserController.delete);

// ─── ND-03: Phân quyền ─────────────────────────────────────

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Gán vai trò cho người dùng (ND-03)
 *     description: >
 *       Admin gán vai trò cho người dùng.
 *       Các vai trò hợp lệ: ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT]
 *                 example: "DOCTOR"
 *     responses:
 *       200:
 *         description: Gán vai trò thành công
 *       400:
 *         description: Vai trò không hợp lệ
 *       404:
 *         description: Người dùng không tồn tại
 */
router.put('/:id/role', validate(validateAssignRole), UserController.assignRole);

module.exports = router;
