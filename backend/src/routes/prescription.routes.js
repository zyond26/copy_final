const express = require('express');
const router = express.Router({ mergeParams: true });
const PrescriptionController = require('../controllers/prescription.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Mọi route đơn thuốc đều yêu cầu đăng nhập (ngoài kiểm tra quyền chi tiết ở service)
router.use(authenticate);

// Định tuyến trực tiếp đến xử lý nghiệp vụ
/**
 * @swagger
 * /api/medical-records/{recordId}/prescriptions:
 *   post:
 *     summary: Kê đơn thuốc mới
 *     description: Bác sĩ điều trị thiết lập danh mục chỉ định dùng thuốc cho bệnh nhân dựa trên hồ sơ bệnh án.
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hồ sơ bệnh án
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Benh nhan ho khan nhieu, uong thuoc sau khi an no."
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - medicine_name
 *                     - duration_days
 *                     - dosage
 *                     - frequency
 *                   properties:
 *                     medicine_name:
 *                       type: string
 *                       example: "Siro ho Prospan 100ml"
 *                     duration_days:
 *                       type: integer
 *                       example: 5
 *                     dosage:
 *                       type: string
 *                       example: "5ml / lan"
 *                     frequency:
 *                       type: string
 *                       example: "3 lan / ngay"
 *                     instruction:
 *                       type: string
 *                       example: "Uong truc tiep sau khi an no"
 *     responses:
 *       201:
 *         description: Kê đơn thuốc mới thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ hoặc thiếu mục thuốc
 *       403:
 *         description: Quyền truy cập bị từ chối (Chỉ DOCTOR)
 */
router.post('/medical-records/:recordId/prescriptions', authorize('prescription:create'), PrescriptionController.create);
/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     summary: Xem chi tiết đơn thuốc
 *     description: Lấy chi tiết nội dung các danh mục thuốc đã chỉ định trong một đơn thuốc cụ thể.
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn thuốc
 *     responses:
 *       200:
 *         description: Lấy thông tin đơn thuốc thành công
 *       403:
 *         description: Không có quyền truy cập đơn thuốc này
 *       404:
 *         description: Không tìm thấy đơn thuốc
 */
router.get('/prescriptions/:id', authorize('prescription:read'), PrescriptionController.getById);
/**
 * @swagger
 * /api/prescriptions/{id}:
 *   put:
 *     summary: Cập nhật đơn thuốc
 *     description: Bác sĩ điều trị điều chỉnh sửa đổi thông tin chỉ định thuốc, liều dùng hoặc cách dùng.
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn thuốc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Dieu chinh lieu luong giam ho, theo doi sat sao."
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     medicine_name:
 *                       type: string
 *                     duration_days:
 *                       type: integer
 *                     dosage:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     instruction:
 *                       type: string
 *     responses:
 *       200:
 *         description: Cập nhật đơn thuốc thành công
 *       400:
 *         description: Dữ liệu cập nhật không đúng định dạng
 *       403:
 *         description: Không có quyền sửa đơn thuốc (Chỉ DOCTOR tạo đơn mới có quyền)
 */
router.put('/prescriptions/:id', authorize('prescription:update'), PrescriptionController.update);
/**
 * @swagger
 * /api/prescriptions/{id}/print:
 *   get:
 *     summary: In đơn thuốc / Xuất PDF
 *     description: Xuất đơn thuốc ra định dạng file PDF chuẩn hóa text không dấu chống lỗi phông chữ phục vụ in ấn lâm sàng.
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn thuốc
 *     responses:
 *       200:
 *         description: Trả về file PDF stream nhị phân thành công
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Không có quyền tải tệp này
 *       404:
 *         description: Không tìm thấy đơn thuốc tương ứng
 */
router.get('/prescriptions/:id/print', authorize('prescription:read'), PrescriptionController.printPDF);

module.exports = router;
