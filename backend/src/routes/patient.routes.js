const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patient.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateCreatePatient, validateUpdateMe } = require('../validators/patient.validator');
const checkBreakGlassAccess = require('../middlewares/breakGlass.middleware');
/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Quản lý bệnh nhân (BP-01 → BP-05)
 */

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Thêm bệnh nhân mới (BP-01)
 *     description: >
 *       Lễ tân / Admin nhập thông tin hành chính của bệnh nhân.
 *       Hệ thống tự động sinh mã bệnh nhân theo format EMR-YYYY-NNNN.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - dob
 *               - gender
 *               - phone
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               email:
 *                 type: string
 *                 example: "nguyenvana@email.com"
 *               address:
 *                 type: string
 *                 example: "123 Nguyễn Trãi, Q.1, TP.HCM"
 *               citizen_id:
 *                 type: string
 *                 example: "079090012345"
 *     responses:
 *       201:
 *         description: Tạo bệnh nhân thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Dữ liệu bị trùng (citizen_id đã tồn tại)
 */
router.post('/', authenticate, authorize('patient:create'), validate(validateCreatePatient), PatientController.create);

router.get('/me', authenticate, authorize('patient:read_own'), PatientController.getMe);
router.put('/me', authenticate, authorize('patient:update_own'), validate(validateUpdateMe), PatientController.updateMe);

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Xóa bệnh nhân (BP-05)
 *     description: Xóa hồ sơ bệnh nhân ra khỏi hệ thống.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bệnh nhân
 *     responses:
 *       200:
 *         description: Xóa bệnh nhân thành công
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
router.delete('/:id', authenticate, authorize('patient:delete'), PatientController.deletePatient);
/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Xem danh sách bệnh nhân (Phân trang)
 *     description: Lấy danh sách bệnh nhân trong hệ thống, sắp xếp theo thời gian tạo giảm dần.
 *     tags: [Patients]
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
 *         description: Lấy danh sách bệnh nhân thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     patients:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 */
router.get('/', authenticate, authorize('patient:read'), PatientController.getAll);
/**
 * @swagger
 * /api/patients/search:
 *   get:
 *     summary: Tìm kiếm bệnh nhân (BP-04)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: "Nguyễn"
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân tìm được
 */

router.get('/search', authenticate, authorize('patient:read'), PatientController.search);


/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Cập nhật thông tin bệnh nhân (BP-03)
 *     description: Cập nhật thông tin hành chính bệnh nhân theo ID.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bệnh nhân
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-10-20"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "FEMALE"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               email:
 *                 type: string
 *                 example: "test@email.com"
 *               address:
 *                 type: string
 *                 example: "456 Lê Lợi"
 *               citizen_id:
 *                 type: string
 *                 example: "079090012346"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy bệnh nhân
 */
router.put('/:id', authenticate, authorize('patient:update'), PatientController.updatePatient);


/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Cập nhật thông tin bệnh nhân (BP-03)
 *     description: Cập nhật thông tin hành chính bệnh nhân theo ID.
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bệnh nhân
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-10-20"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "FEMALE"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               email:
 *                 type: string
 *                 example: "test@email.com"
 *               address:
 *                 type: string
 *                 example: "456 Lê Lợi"
 *               citizen_id:
 *                 type: string
 *                 example: "079090012346"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy bệnh nhân
*/
/**
 * @swagger
 * /api/patients/me:
 *   get:
 *     summary: Xem thông tin hồ sơ cá nhân
 *     description: Bệnh nhân xem thông tin hồ sơ y tế hành chính của chính mình.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy hồ sơ
 *   put:
 *     summary: Cập nhật thông tin hồ sơ cá nhân
 *     description: Bệnh nhân cập nhật các thông tin còn thiếu (ngày sinh, giới tính, số điện thoại, địa chỉ).
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               address:
 *                 type: string
 *                 example: "123 Nguyễn Trãi, Q.1, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */


/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Lấy chi tiết bệnh nhân
 *     description: Trả về thông tin chi tiết của 1 bệnh nhân theo ID.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy bệnh nhân
 */
router.get('/:id', authenticate, authorize('patient:read'), PatientController.getById);

/**
 * @swagger
 * /api/patients/auto-merge:
 *   post:
 *     summary: Hệ thống tự động gộp các hồ sơ bệnh nhân bị trùng lặp
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gộp thành công
 */
router.post('/auto-merge', authenticate, authorize('patient:delete'), PatientController.autoMerge);

module.exports = router;
