const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter, sensitiveLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateVerifyMfa,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
} = require('../validators/auth.validator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Xác thực & Quản lý phiên (ND-01 → ND-05)
 */

// Lớp phòng thủ Brute Force: giới hạn chung cho mọi route /api/auth (ISO 27799 §9.4.2)
router.use(authLimiter);

// ─── ND-01: Đăng ký tài khoản (Bệnh nhân) ──────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản bệnh nhân (ND-01)
 *     description: >
 *       Bệnh nhân tự đăng ký tài khoản. Hệ thống gửi mã OTP đến email
 *       để xác thực. Tài khoản ở trạng thái PENDING cho đến khi xác thực email.
 *     tags: [Auth]
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "benhnhan@email.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 15
 *                 description: "8–15 ký tự, có chữ, chữ hoa, số và ký tự đặc biệt."
 *                 example: "MatKhau@123"
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               username:
 *                 type: string
 *                 example: "nguyenvana"
 *               citizen_id:
 *                 type: string
 *                 description: "Số CCCD gồm đúng 12 chữ số."
 *                 example: "001200123456"
 *     responses:
 *       201:
 *         description: Đăng ký thành công, OTP đã gửi qua email
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email hoặc username đã tồn tại
 */
router.post('/register', validate(validateRegister), AuthController.register);

// ─── ND-01: Xác thực email ──────────────────────────────────

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Xác thực email đăng ký (ND-01)
 *     description: >
 *       Nhập mã OTP đã gửi qua email để kích hoạt tài khoản.
 *       Sau khi xác thực, tài khoản chuyển sang trạng thái ACTIVE.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp_code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "benhnhan@email.com"
 *               otp_code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Xác thực email thành công
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Email không tồn tại
 *       429:
 *         description: Quá nhiều lần thử (rate limit chống brute force)
 */
router.post('/verify-email', sensitiveLimiter, validate(validateVerifyEmail), AuthController.verifyEmail);

// ─── ND-02: Đăng nhập ───────────────────────────────────────

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập (ND-02)
 *     description: >
 *       Xác thực bằng email và mật khẩu. Nếu MFA bật, hệ thống gửi OTP
 *       đến email và trả về temporary_token để dùng ở bước verify MFA.
 *       Nếu MFA tắt, trả về access_token trực tiếp.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "doctor@example.com"
 *               password:
 *                 type: string
 *                 example: "MatKhau@123"
 *     responses:
 *       200:
 *         description: >
 *           Nếu MFA bật: trả requires_mfa=true + temporary_token.
 *           Nếu MFA tắt: trả access_token + refresh_token.
 *       401:
 *         description: Email hoặc mật khẩu không đúng (kèm số lần thử còn lại)
 *       403:
 *         description: Tài khoản chưa xác thực, bị khóa, hoặc tạm khóa do đăng nhập sai nhiều lần
 *       429:
 *         description: Quá nhiều lần thử đăng nhập (rate limit chống brute force)
 */
router.post('/login', sensitiveLimiter, validate(validateLogin), AuthController.login);

// ─── ND-02: Xác thực MFA ────────────────────────────────────

/**
 * @swagger
 * /api/auth/mfa/verify:
 *   post:
 *     summary: Xác thực MFA - OTP (ND-02)
 *     description: >
 *       Bước 2 đăng nhập: nhập mã OTP đã gửi qua email.
 *       Yêu cầu temporary_token từ bước login trong header Authorization.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp_code
 *             properties:
 *               otp_code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Xác thực thành công, trả access_token + refresh_token
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn (vô hiệu sau 5 lần sai)
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       429:
 *         description: Quá nhiều lần thử (rate limit chống brute force)
 */
router.post('/mfa/verify', sensitiveLimiter, authenticate, validate(validateVerifyMfa), AuthController.verifyMfa);

// ─── MFA Setup / Disable ────────────────────────────────────

/**
 * @swagger
 * /api/auth/mfa/setup:
 *   post:
 *     summary: Bật MFA cho tài khoản
 *     description: Kích hoạt xác thực đa yếu tố (MFA) cho tài khoản hiện tại.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA đã được bật
 *       400:
 *         description: MFA đã được bật trước đó
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/mfa/setup', authenticate, AuthController.setupMfa);

/**
 * @swagger
 * /api/auth/mfa/disable:
 *   post:
 *     summary: Tắt MFA cho tài khoản
 *     description: Tắt xác thực đa yếu tố (MFA) cho tài khoản hiện tại.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA đã được tắt
 *       400:
 *         description: MFA chưa được bật
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/mfa/disable', authenticate, AuthController.disableMfa);

// ─── ND-04: Đổi mật khẩu ────────────────────────────────────

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu (ND-04)
 *     description: Người dùng tự đổi mật khẩu. Yêu cầu nhập mật khẩu hiện tại.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 example: "MatKhau@123"
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 15
 *                 description: "8–15 ký tự, có chữ, chữ hoa, số và ký tự đặc biệt; phải khác mật khẩu hiện tại."
 *                 example: "MatKhauMoi@9"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu hiện tại không đúng hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/change-password', authenticate, validate(validateChangePassword), AuthController.changePassword);

// ─── ND-05: Quên mật khẩu ───────────────────────────────────

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Quên mật khẩu (ND-05)
 *     description: >
 *       Gửi mã OTP khôi phục mật khẩu đến email.
 *       Không tiết lộ email có tồn tại hay không (bảo mật).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Nếu email tồn tại, OTP đã được gửi
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       429:
 *         description: Quá nhiều lần thử (rate limit chống brute force)
 */
router.post('/forgot-password', sensitiveLimiter, validate(validateForgotPassword), AuthController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu (ND-05)
 *     description: Đặt lại mật khẩu bằng mã OTP đã nhận qua email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp_code
 *               - new_password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp_code:
 *                 type: string
 *                 example: "123456"
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 15
 *                 description: "8–15 ký tự, có chữ, chữ hoa, số và ký tự đặc biệt; phải khác mật khẩu cũ."
 *                 example: "MatKhauMoi@9"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không hợp lệ/hết hạn, hoặc mật khẩu mới trùng mật khẩu cũ
 *       404:
 *         description: Email không tồn tại
 *       429:
 *         description: Quá nhiều lần thử (rate limit chống brute force)
 */
router.post('/reset-password', sensitiveLimiter, validate(validateResetPassword), AuthController.resetPassword);

// ─── Logout ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     description: Đăng xuất khỏi hệ thống. Client tự xóa token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
