const nodemailer = require('nodemailer');

/**
 * Email Service – gửi email qua SMTP (Nodemailer).
 * Cấu hình SMTP lấy từ biến môi trường.
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const EmailService = {
  /**
   * Gửi mã OTP xác thực email (đăng ký tài khoản).
   * @param {string} to - Địa chỉ email người nhận
   * @param {string} otpCode - Mã OTP 6 chữ số
   */
  async sendVerificationOtp(to, otpCode) {
    const mailOptions = {
      from: `"Mini EMR" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Xác thực email đăng ký - Mini EMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Mini EMR - Xác thực email</h2>
          <p>Xin chào,</p>
          <p>Mã OTP xác thực email của bạn là:</p>
          <div style="background: #f0f4ff; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otpCode}</span>
          </div>
          <p>Mã có hiệu lực trong <strong>${process.env.MFA_OTP_EXPIRES_MINUTES || 5} phút</strong>.</p>
          <p style="color: #6b7280; font-size: 13px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        </div>
      `,
      text: `Xin chào,\nMã OTP xác thực email của bạn là: ${otpCode}\nMã có hiệu lực trong ${process.env.MFA_OTP_EXPIRES_MINUTES || 5} phút.`,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-Mailer': 'Nodemailer',
        'List-Unsubscribe': `<mailto:${process.env.SMTP_USER}?subject=unsubscribe>`,
      },
    };

    await transporter.sendMail(mailOptions);
  },

  /**
   * Gửi mã OTP đăng nhập MFA.
   * @param {string} to - Địa chỉ email người nhận
   * @param {string} otpCode - Mã OTP 6 chữ số
   */
  async sendLoginOtp(to, otpCode) {
    const mailOptions = {
      from: `"Mini EMR" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Mã xác thực đăng nhập - Mini EMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Mini EMR - Xác thực đăng nhập</h2>
          <p>Xin chào,</p>
          <p>Mã OTP đăng nhập của bạn là:</p>
          <div style="background: #f0f4ff; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otpCode}</span>
          </div>
          <p>Mã có hiệu lực trong <strong>${process.env.MFA_OTP_EXPIRES_MINUTES || 5} phút</strong>.</p>
          <p style="color: #dc2626; font-size: 13px;">⚠️ Không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      `,
      text: `Xin chào,\nMã OTP đăng nhập của bạn là: ${otpCode}\nMã có hiệu lực trong ${process.env.MFA_OTP_EXPIRES_MINUTES || 5} phút.\n⚠️ Không chia sẻ mã này cho bất kỳ ai.`,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-Mailer': 'Nodemailer',
      },
    };

    await transporter.sendMail(mailOptions);
  },

  /**
   * Gửi mã OTP khôi phục mật khẩu.
   * @param {string} to - Địa chỉ email người nhận
   * @param {string} otpCode - Mã OTP 6 chữ số
   */
  async sendPasswordResetOtp(to, otpCode) {
    const mailOptions = {
      from: `"Mini EMR" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Khôi phục mật khẩu - Mini EMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Mini EMR - Khôi phục mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu khôi phục mật khẩu. Mã OTP của bạn là:</p>
          <div style="background: #fef2f2; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc2626;">${otpCode}</span>
          </div>
          <p>Mã có hiệu lực trong <strong>${process.env.MFA_OTP_EXPIRES_MINUTES || 5} phút</strong>.</p>
          <p style="color: #6b7280; font-size: 13px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và đổi mật khẩu ngay.</p>
        </div>
      `,
      text: `Xin chào,\nBạn đã yêu cầu khôi phục mật khẩu. Mã OTP của bạn là: ${otpCode}\nMã có hiệu lực trong ${process.env.MFA_OTP_EXPIRES_MINUTES || 5} phút.`,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-Mailer': 'Nodemailer',
      },
    };

    await transporter.sendMail(mailOptions);
  },

  /**
   * Gửi thông báo cập nhật trạng thái lịch hẹn khám.
   * @param {string} to - Địa chỉ email người nhận
   * @param {object} details - Chi tiết lịch khám
   * @param {string} details.patientName
   * @param {string} details.appointmentCode
   * @param {Date} details.date
   * @param {string} details.status
   * @param {string} details.doctorName
   */
  async sendAppointmentStatusEmail(to, { patientName, appointmentCode, date, status, doctorName }) {
    let statusText = '';
    let color = '#2563eb';
    if (status === 'CONFIRMED') {
      statusText = 'Đã duyệt (CONFIRMED)';
      color = '#10b981';
    } else if (status === 'CANCELLED') {
      statusText = 'Đã hủy (CANCELLED)';
      color = '#ef4444';
    } else if (status === 'COMPLETED') {
      statusText = 'Đã khám hoàn thành (COMPLETED)';
      color = '#3b82f6';
    } else {
      statusText = status;
    }

    const mailOptions = {
      from: `"Mini EMR" <${process.env.SMTP_USER}>`,
      to,
      subject: `Cập nhật lịch hẹn khám ${appointmentCode} - ${statusText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 8px; margin-top: 0;">Cập nhật lịch hẹn khám</h2>
          <p>Xin chào <strong>${patientName}</strong>,</p>
          <p>Lịch hẹn khám bệnh của bạn tại hệ thống Mini EMR đã được cập nhật trạng thái mới:</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${color};">
            <p style="margin: 4px 0;"><strong>Mã lịch hẹn:</strong> ${appointmentCode}</p>
            <p style="margin: 4px 0;"><strong>Bác sĩ khám:</strong> ${doctorName}</p>
            <p style="margin: 4px 0;"><strong>Thời gian:</strong> ${new Date(date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
            <p style="margin: 4px 0;"><strong>Trạng thái mới:</strong> <span style="color: ${color}; font-weight: bold;">${statusText}</span></p>
          </div>
          <p>Vui lòng theo dõi lịch hẹn trên cổng thông tin bệnh nhân để biết thêm chi tiết.</p>
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 8px;">Đây là email tự động từ hệ thống Mini EMR, vui lòng không phản hồi lại email này.</p>
        </div>
      `,
      text: `Xin chào ${patientName},\nLịch hẹn khám ${appointmentCode} đã được cập nhật trạng thái sang: ${statusText}.\nBác sĩ: ${doctorName}\nThời gian: ${new Date(date).toLocaleString('vi-VN')}\nCảm ơn bạn đã sử dụng dịch vụ.`,
    };

    await transporter.sendMail(mailOptions);
  },
};

module.exports = EmailService;
