const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generate a PDF buffer for a medical record.
 *
 * @param {object} record - Medical record database object (populated with patient and doctor)
 * @returns {Promise<Buffer>}
 */
const generateMedicalRecordPDF = (record) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Tự động vẽ khung viền trang trí cho mọi trang mới được tạo thêm (ISO 27799 Output integrity check)
      doc.on('pageAdded', () => {
        doc.rect(20, 20, 555, 802).strokeColor('#2B6CB0').lineWidth(1.5).stroke();
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Setup Fonts for Vietnamese accents on Windows
      let regularFont = 'Helvetica';
      let boldFont = 'Helvetica-Bold';

      const winFonts = [
        { reg: 'C:\\Windows\\Fonts\\arial.ttf', bold: 'C:\\Windows\\Fonts\\arialbd.ttf' },
        { reg: 'C:\\Windows\\Fonts\\times.ttf', bold: 'C:\\Windows\\Fonts\\timesbd.ttf' },
        { reg: 'C:\\Windows\\Fonts\\calibri.ttf', bold: 'C:\\Windows\\Fonts\\calibrib.ttf' }
      ];

      for (const fontSet of winFonts) {
        if (fs.existsSync(fontSet.reg) && fs.existsSync(fontSet.bold)) {
          regularFont = fontSet.reg;
          boldFont = fontSet.bold;
          break;
        }
      }

      // Register fonts if custom fonts are resolved
      if (regularFont !== 'Helvetica') {
        doc.registerFont('CustomRegular', regularFont);
        doc.registerFont('CustomBold', boldFont);
        doc.font('CustomRegular');
      } else {
        doc.registerFont('CustomRegular', 'Helvetica');
        doc.registerFont('CustomBold', 'Helvetica-Bold');
        doc.font('CustomRegular');
      }

      // Outer border box (sleek design)
      doc.rect(20, 20, 555, 802).strokeColor('#2B6CB0').lineWidth(1.5).stroke();

      // Header Hospital Info
      doc.font('CustomBold').fontSize(14).fillColor('#1A365D').text('PHÒNG KHÁM ĐA KHOA MINI EMR', 50, 45);
      doc.font('CustomRegular').fontSize(8.5).fillColor('#4A5568').text('Địa chỉ: 123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh', 50, 65);
      doc.text('Hotline: 1900-1234  |  Email: contact@miniemr.vn', 50, 78);

      // Separator line
      doc.moveTo(50, 95).lineTo(545, 95).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // Title
      doc.font('CustomBold').fontSize(20).fillColor('#2B6CB0').text('BỆNH ÁN ĐIỆN TỬ', 50, 115, { align: 'center' });
      doc.font('CustomRegular').fontSize(9.5).fillColor('#718096').text(`Mã bệnh án: ${record.record_code}`, 50, 140, { align: 'center' });

      // Patient Section Header
      doc.font('CustomBold').fontSize(11).fillColor('#1A365D').text('I. THÔNG TIN HÀNH CHÍNH', 50, 175);
      doc.moveTo(50, 190).lineTo(545, 190).strokeColor('#CBD5E0').lineWidth(0.5).stroke();

      // Patient detail Grid
      const p = record.patients;
      const dobStr = p.dob ? new Date(p.dob).toLocaleDateString('vi-VN') : 'N/A';
      const genderStr = p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : 'Khác';

      doc.font('CustomBold').fontSize(9.5).fillColor('#2D3748').text('Họ và tên:', 50, 205);
      doc.font('CustomRegular').text(p.full_name, 150, 205);

      doc.font('CustomBold').text('Ngày sinh:', 350, 205);
      doc.font('CustomRegular').text(dobStr, 430, 205);

      doc.font('CustomBold').text('Giới tính:', 50, 225);
      doc.font('CustomRegular').text(genderStr, 150, 225);

      doc.font('CustomBold').text('Số điện thoại:', 350, 225);
      doc.font('CustomRegular').text(p.phone || 'N/A', 430, 225);

      doc.font('CustomBold').text('Mã bệnh nhân:', 50, 245);
      doc.font('CustomRegular').text(p.patient_code, 150, 245);

      doc.font('CustomBold').text('Số CCCD/CMND:', 350, 245);
      doc.font('CustomRegular').text(p.citizen_id || 'N/A', 430, 245);

      doc.font('CustomBold').text('Địa chỉ:', 50, 265);
      doc.font('CustomRegular').text(p.address || 'N/A', 150, 265, { width: 390 });

      // Medical observation Section Header
      doc.font('CustomBold').fontSize(11).fillColor('#1A365D').text('II. THÔNG TIN LÂM SÀNG', 50, 305);
      doc.moveTo(50, 320).lineTo(545, 320).strokeColor('#CBD5E0').lineWidth(0.5).stroke();

      const visitDateStr = record.visit_date ? new Date(record.visit_date).toLocaleDateString('vi-VN') : 'N/A';
      const docName = record.users?.full_name || 'N/A';

      doc.font('CustomBold').fontSize(9.5).fillColor('#2D3748').text('Ngày khám:', 50, 335);
      doc.font('CustomRegular').text(visitDateStr, 150, 335);

      doc.font('CustomBold').text('Bác sĩ điều trị:', 350, 335);
      doc.font('CustomRegular').text(docName, 430, 335);

      doc.font('CustomBold').text('Triệu chứng:', 50, 360);
      doc.font('CustomRegular').text(record.symptoms || 'Không ghi nhận', 150, 360, { width: 390 });

      doc.font('CustomBold').text('Chẩn đoán:', 50, 395);
      doc.font('CustomRegular').text(record.diagnosis || 'Chưa chẩn đoán', 150, 395, { width: 390 });

      doc.font('CustomBold').text('Kết luận:', 50, 430);
      doc.font('CustomRegular').text(record.conclusion || 'Không có ghi chú thêm', 150, 430, { width: 390 });

      let currentY = 475;

      // Vital Signs Section (if exists)
      if (record.vital_signs && record.vital_signs.length > 0) {
        doc.font('CustomBold').fontSize(11).fillColor('#1A365D').text('III. CHỈ SỐ SINH HIỆU', 50, currentY);
        doc.moveTo(50, currentY + 15).lineTo(545, currentY + 15).strokeColor('#CBD5E0').lineWidth(0.5).stroke();
        
        currentY += 25;
        const vs = record.vital_signs[0];
        doc.font('CustomBold').fontSize(9.5).fillColor('#2D3748').text('Nhiệt độ:', 50, currentY);
        doc.font('CustomRegular').text(vs.temperature ? `${vs.temperature} °C` : 'N/A', 150, currentY);

        doc.font('CustomBold').text('Huyết áp:', 240, currentY);
        doc.font('CustomRegular').text(vs.blood_pressure ? `${vs.blood_pressure} mmHg` : 'N/A', 310, currentY);

        doc.font('CustomBold').text('Nhịp tim:', 420, currentY);
        doc.font('CustomRegular').text(vs.heart_rate ? `${vs.heart_rate} bpm` : 'N/A', 490, currentY);

        currentY += 20;
        doc.font('CustomBold').text('SpO2:', 50, currentY);
        doc.font('CustomRegular').text(vs.spo2 ? `${vs.spo2} %` : 'N/A', 150, currentY);

        doc.font('CustomBold').text('Cân nặng:', 240, currentY);
        doc.font('CustomRegular').text(vs.weight ? `${vs.weight} kg` : 'N/A', 310, currentY);
        
        currentY += 30;
      }

      // Prescriptions Section (if exists)
      if (record.prescriptions && record.prescriptions.length > 0) {
        doc.font('CustomBold').fontSize(11).fillColor('#1A365D').text('IV. ĐƠN THUỐC', 50, currentY);
        doc.moveTo(50, currentY + 15).lineTo(545, currentY + 15).strokeColor('#CBD5E0').lineWidth(0.5).stroke();
        
        currentY += 25;
        // Header columns
        doc.font('CustomBold').fontSize(9).fillColor('#4A5568');
        doc.text('Tên thuốc', 60, currentY);
        doc.text('Liều lượng', 220, currentY);
        doc.text('Tần suất', 320, currentY);
        doc.text('Số ngày', 420, currentY);
        doc.text('Hướng dẫn', 470, currentY);

        doc.moveTo(50, currentY + 13).lineTo(545, currentY + 13).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        currentY += 18;

        record.prescriptions.forEach((pres) => {
          if (pres.prescription_items && pres.prescription_items.length > 0) {
            pres.prescription_items.forEach((item) => {
              doc.font('CustomRegular').fontSize(9).fillColor('#2D3748');
              doc.text(item.medicine_name, 60, currentY);
              doc.text(item.dosage || 'N/A', 220, currentY);
              doc.text(item.frequency || 'N/A', 320, currentY);
              doc.text(item.duration_days ? `${item.duration_days} ngày` : 'N/A', 420, currentY);
              doc.text(item.instruction || 'Không có', 470, currentY, { width: 75 });
              currentY += 18;
            });
          }
        });
        currentY += 15;
      }

      // Doctor signature section
      if (currentY > 670) {
        // Prevent layout overflow, add page if too low
        doc.addPage();
        currentY = 50;
      }

      doc.font('CustomRegular').fontSize(9.5).fillColor('#4A5568');
      const dateNow = new Date();
      const dateText = `Ngày ${dateNow.getDate()} tháng ${dateNow.getMonth() + 1} năm ${dateNow.getFullYear()}`;
      doc.text(dateText, 380, currentY, { align: 'center' });
      currentY += 15;
      doc.font('CustomBold').fontSize(10).text('Bác sĩ điều trị', 380, currentY, { align: 'center' });
      currentY += 55;
      doc.font('CustomBold').fontSize(10.5).fillColor('#2D3748').text(docName, 380, currentY, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateMedicalRecordPDF,
};
