'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button, FormField, Card, CardHeader, CardBody, CardFooter,
  Alert, Spinner,
} from '@/components/ui';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL &&
  process.env.NEXT_PUBLIC_API_URL !== 'undefined' &&
  process.env.NEXT_PUBLIC_API_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_API_URL
    : 'https://mini-emr-backend-tg4r.onrender.com';

export default function RegisterPage() {
  const router = useRouter();
  
  // Register Form States
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    citizen_id: ''
  });
  
  // Verification States
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi đăng ký tài khoản.');
      }

      setRequiresOtp(true);
      setSuccess('Đăng ký thành công! Mã xác thực OTP đã được gửi đến email của bạn.');
    } catch (err) {
      setError(err.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Vui lòng nhập mã xác thực OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp_code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      }

      setSuccess('Xác thực email thành công! Đang chuyển tiếp đến trang đăng nhập...');
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError(err.message || 'Lỗi xác thực OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '90vh',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <h1 style={{ color: 'var(--color-primary-deep)', margin: 0, fontWeight: 800 }}>CỔNG THÔNG TIN Y TẾ EMR</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Hệ thống Quản lý Bệnh án Điện tử chuẩn ISO 27799</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {!requiresOtp ? (
          <Card>
            <CardHeader title="Đăng Ký Tài Khoản Mới" />
            <form onSubmit={handleRegister}>
              <CardBody>
                <FormField
                  label="Họ và tên"
                  type="text"
                  name="full_name"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
                <FormField
                  label="Tên đăng nhập (Username)"
                  type="text"
                  name="username"
                  required
                  placeholder="Ví dụ: nguyenvana"
                  value={formData.username}
                  onChange={handleInputChange}
                />
                <FormField
                  label="Địa chỉ Email"
                  type="email"
                  name="email"
                  required
                  placeholder="nguyenvana@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <FormField
                  label="Số CCCD / CMND"
                  type="text"
                  name="citizen_id"
                  required
                  placeholder="Gồm đủ 12 chữ số"
                  value={formData.citizen_id}
                  onChange={handleInputChange}
                />
                <FormField
                  label="Mật khẩu"
                  type="password"
                  name="password"
                  required
                  placeholder="8-15 ký tự, gồm tối thiểu một chữ, một số và một ký tự đặc biệt"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </CardBody>
              <CardFooter style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? <Spinner /> : 'Tiếp tục'}
                </Button>
                <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', width: '100%' }}>
                  Đã có tài khoản?{' '}
                  <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    Đăng nhập tại đây
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Xác Thực Email Bằng Mã OTP" />
            <form onSubmit={handleVerifyOtp}>
              <CardBody>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                  Mã OTP gồm 6 chữ số đã được gửi đến email <strong>{formData.email}</strong>. Vui lòng nhập vào bên dưới để hoàn tất xác thực.
                </p>
                <FormField
                  label="Mã xác thực OTP"
                  type="text"
                  required
                  placeholder="Nhập 6 số"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </CardBody>
              <CardFooter style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" onClick={() => setRequiresOtp(false)} disabled={loading}>
                  Sửa email
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner /> : 'Kích hoạt tài khoản'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
