const PrescriptionService = require('../services/prescription.service');
const { validatePrescription } = require('../validators/prescription.validator');
const { getCurrentTime } = require('../utils/time');
const { success, error } = require('../utils/response'); // Sử dụng đúng file response.js từ ảnh của bạn
const PDFDocument = require('pdfkit-table');

const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s.,:\-\/()]/g, ''); // Lọc bỏ các ký tự lạ phát sinh ngoài ý muốn
};

const PrescriptionController = {
  /**
   * POST /api/medical-records/:recordId/prescriptions
   * Kê đơn thuốc mới.
   */
  async create(req, res, next) {
    try {
      const { isValid, errors } = validatePrescription(req.body);
      if (!isValid) return error(res, 'Dữ liệu đầu vào không hợp lệ.', 400, errors);

      const ipAddress = req.ip || '127.0.0.1';
      const authHeader = req.headers.authorization; // Lấy chuỗi Bearer Token từ Postman gửi lên

      const result = await PrescriptionService.create(req.params.recordId, req.body, authHeader, ipAddress);
      return success(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/prescriptions/:id
   * Xem chi tiết đơn thuốc bằng ID.
   */
  async getById(req, res, next) {
    try {
      const ipAddress = req.ip || '127.0.0.1';
      const authHeader = req.headers.authorization;

      const result = await PrescriptionService.findById(req.params.id, authHeader, ipAddress);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/prescriptions/:id
   * Cập nhật thông tin đơn thuốc.
   */
  async update(req, res, next) {
    try {
      const { isValid, errors } = validatePrescription(req.body);
      if (!isValid) return error(res, 'Dữ liệu cập nhật không đúng.', 400, errors);

      const ipAddress = req.ip || '127.0.0.1';
      const authHeader = req.headers.authorization;

      const result = await PrescriptionService.update(req.params.id, req.body, authHeader, ipAddress);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/prescriptions/:id/print
   * In đơn thuốc điện tử PDF chuẩn hóa không dấu (Kết hợp vẽ bảng thẩm mỹ).
   */
  async printPDF(req, res, next) {
    try {
      const ipAddress = req.ip || '127.0.0.1';
      const authHeader = req.headers.authorization;
      const data = await PrescriptionService.generatePDF(req.params.id, authHeader, ipAddress);

      // Khởi tạo khổ A5 dọc, căn lề gọn gàng
      const doc = new PDFDocument({ size: 'A5', margin: 25 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=prescription-${req.params.id}.pdf`);
      doc.pipe(res);

      // Sử dụng font lõi mặc định Helvetica (An toàn tuyệt đối, chạy cực nhẹ)
      doc.font('Helvetica'); 

      // --- PHẦN TIÊU ĐỀ PHÒNG KHÁM ---
      doc.fontSize(10).font('Helvetica-Bold').text('PHONG KHAM DA KHOA CMC', { align: 'left' });
      doc.fontSize(8).font('Helvetica').text('Dia chi: 236 Hoang Quoc Viet, Cau Giay, Ha Noi', { align: 'left' });
      doc.moveDown(0.4);
      
      doc.moveTo(25, doc.y).lineTo(395, doc.y).strokeColor('#cccccc').lineWidth(1).stroke();
      doc.moveDown(1);

      doc.fontSize(15).font('Helvetica-Bold').text('DON THUOC DIEN TU', { align: 'center' });
      doc.fontSize(8.5).font('Helvetica-Oblique').text(`Ma so don: DT-2026-${req.params.id}`, { align: 'center' });
      doc.moveDown(1.5);

      // --- THÔNG TIN HÀNH CHÍNH BỆNH NHÂN ---
      const patient = data.medical_records.patients;
      doc.font('Helvetica').fontSize(10);
      
      const currentY = doc.y;
      // Tên bệnh nhân viết hoa không dấu
      const cleanPatientName = removeVietnameseTones(patient.full_name).toUpperCase();
      doc.text('Ho va ten: ', 25, currentY).font('Helvetica-Bold').text(cleanPatientName, 80, currentY);
      doc.font('Helvetica').text('Ma y te: ', 250, currentY).font('Helvetica-Bold').text(`${patient.patient_code}`, 295, currentY);
      
      doc.moveDown(0.6);
      const nextY = doc.y;
      const cleanAddress = removeVietnameseTones(patient.address || 'KHONG GHI NHAN');
      doc.font('Helvetica').text(`Dia chi: ${cleanAddress}`, 25, nextY);
      doc.moveDown(1.5);

      // --- THIẾT KẾ BẢNG THUỐC KHÔNG DẤU ---
      doc.font('Helvetica-Bold').fontSize(10.5).text('CHI DINH DUNG THUOC:');
      doc.moveDown(0.5);

      // Chuẩn bị cấu trúc bảng dữ liệu thuốc (Đều chạy qua hàm xóa dấu)
      const tableData = {
        headers: [
          { label: 'STT', property: 'stt', width: 30, align: 'center' },
          { label: 'Ten Thuoc / Cach Dung', property: 'medicine', width: 260 },
          { label: 'S.Luong', property: 'duration', width: 55, align: 'center' }
        ],
        rows: data.prescription_items.map((item, idx) => {
          const medName = removeVietnameseTones(item.medicine_name).toUpperCase();
          const instruction = removeVietnameseTones(item.instruction || 'Theo chi dinh');
          const dosage = removeVietnameseTones(item.dosage);
          const freq = removeVietnameseTones(item.frequency);
          
          return [
            `${idx + 1}`,
            `${medName}\n  Cach dung: ${instruction} (${dosage} / ${freq})`,
            `${item.duration_days} ngay`
          ];
        })
      };

      // Vẽ bảng tự động phẳng phiu, sạch sẽ
      await doc.table(tableData, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9.5),
        prepareRow: (row, index) => doc.font('Helvetica').fontSize(9),
        padding: 5,
        borderHorizontalWidth: 0.5,
        borderVerticalWidth: 0,
        borderColor: '#e0e0e0'
      });

      // --- PHẦN LỜI DẶN KHÔNG DẤU ---
      if (data.note) {
        doc.moveDown(1);
        doc.font('Helvetica-BoldOblique').fontSize(10).text('Loi dan cua bac si: ', 25);
        doc.font('Helvetica').fontSize(9.5).text(`- ${removeVietnameseTones(data.note)}`, 35);
      }

      // --- PHẦN CHỮ KÝ BÁC SĨ ---
      doc.moveDown(2);
      const footerY = doc.y;
      
      const now = getCurrentTime();
      doc.font('Helvetica-Oblique').fontSize(9).text(`Ngay ${now.getDate()} thang ${now.getMonth() + 1} nam ${now.getFullYear()}`, 230, footerY, { align: 'center', width: 165 });
      
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(10).text('BAC SI DIEU TRI', 230, doc.y, { align: 'center', width: 165 });
      doc.font('Helvetica-Oblique').fontSize(8).text('(Ky, ghi ro ho ten)', 230, doc.y, { align: 'center', width: 165 });
      
      doc.moveDown(2.5);
      const doctorName = removeVietnameseTones(data.medical_records.users?.full_name || 'BS. NGUYEN VAN TRI').toUpperCase();
      doc.font('Helvetica-Bold').fontSize(10).text(doctorName, 230, doc.y, { align: 'center', width: 165 });

      doc.end();
    } catch (err) {
      next(err);
    }
  },
};

module.exports = PrescriptionController;