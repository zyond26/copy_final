'use client';

import { useState } from 'react';
import axiosInstance from '@/src/api/axiosInstance';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import styles from './AuthModal.module.css';

export default function SignupModal({ isOpen, onClose, onLoginClick }) {
  const [step, setStep] = useState(1); // 1: Form, 2: Email Verify
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    citizen_id: '',
    dob: '',
    gender: 'MALE',
    phone: '',
    address: '',
  });

  // Email verification
  const [emailToVerify, setEmailToVerify] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      !formData.email ||
      !formData.password ||
      !formData.full_name ||
      !formData.username ||
      !formData.citizen_id ||
      !formData.dob ||
      !formData.gender ||
      !formData.phone ||
      !formData.address
    ) {
      setError('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axiosInstance.post('/api/auth/register', formData);
      if (res.data.status === 'success') {
        setSuccess('✓ Đăng ký thành công! Vui lòng xác thực email.');
        setEmailToVerify(formData.email);
        setStep(2);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axiosInstance.post('/api/auth/verify-email', {
        email: emailToVerify,
        otp_code: otpCode,
      });

      if (res.data.status === 'success') {
        setSuccess('✓ Email xác thực thành công! Tài khoản đã được kích hoạt.');
        setTimeout(() => {
          onClose();
          setStep(1);
          setFormData({
            username: '',
            email: '',
            password: '',
            full_name: '',
            citizen_id: '',
            dob: '',
            gender: 'MALE',
            phone: '',
            address: '',
          });
          setOtpCode('');
          setEmailToVerify('');
          onLoginClick?.();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực email thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className={styles.container} style={{ maxHeight: 'min(90vh, 100%)' }}>
        {/* Header */}
        <div className={styles.header}>
          <h2>
            {step === 1 ? '📋 Đăng Ký Tài Khoản' : '✉️ Xác Thực Email'}
          </h2>
          <p>
            {step === 1
              ? 'Tạo tài khoản bệnh nhân Mini EMR'
              : 'Nhập mã OTP gửi đến email của bạn'}
          </p>
        </div>

        {/* Alerts */}
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.formGrid}>
              <FormField
                label="Họ và tên"
                required
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={handleInputChange}
                name="full_name"
                disabled={loading}
              />
              <FormField
                label="Tên đăng nhập"
                required
                placeholder="nguyenvana"
                value={formData.username}
                onChange={handleInputChange}
                name="username"
                disabled={loading}
              />
            </div>

            <FormField
              label="Email"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              name="email"
              disabled={loading}
            />

            <FormField
              label="Mật khẩu"
              type="password"
              required
              placeholder="Ít nhất 8 ký tự"
              value={formData.password}
              onChange={handleInputChange}
              name="password"
              disabled={loading}
            />

            <div className={styles.formGrid}>
              <FormField
                label="CMND/CCCD"
                required
                placeholder="123456789012"
                value={formData.citizen_id}
                onChange={handleInputChange}
                name="citizen_id"
                maxLength="12"
                disabled={loading}
              />
              <FormField
                label="Ngày sinh"
                type="date"
                required
                value={formData.dob}
                onChange={handleInputChange}
                name="dob"
                disabled={loading}
              />
            </div>

            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Giới tính <span className="required">*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <FormField
                label="Số điện thoại"
                required
                placeholder="0912345678"
                value={formData.phone}
                onChange={handleInputChange}
                name="phone"
                disabled={loading}
              />
            </div>

            <FormField
              label="Địa chỉ"
              required
              placeholder="123 Đường ABC, TP HCM"
              value={formData.address}
              onChange={handleInputChange}
              name="address"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn btn--primary"
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <Spinner /> Đang xử lý...
                </>
              ) : (
                '📝 Tiếp Tục Đăng Ký'
              )}
            </button>
          </form>
        )}

        {/* Step 2: Email Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyEmail} className={styles.form}>
            <div className={styles.verifyInfo}>
              <p>Mã OTP đã được gửi đến:</p>
              <strong>{emailToVerify}</strong>
            </div>

            <FormField
              label="Mã OTP (6 số)"
              type="text"
              required
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              maxLength="6"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn btn--primary"
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <Spinner /> Đang xác thực...
                </>
              ) : (
                '✓ Xác Thực Email'
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
              Không nhận được mã? Kiểm tra thư rác.
            </p>
          </form>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          {step === 1 && (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setError('');
                  setSuccess('');
                  setTimeout(onLoginClick, 200);
                }}
                className={styles.switchLink}
              >
                Đăng nhập tại đây
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
