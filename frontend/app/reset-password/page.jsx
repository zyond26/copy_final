'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  FormField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Alert,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/src/context/AuthContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !otpCode || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các trường.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otpCode, newPassword);
      setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại ngay bây giờ.');
      setTimeout(() => router.push('/'), 1800);
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <Card>
          <CardHeader title="Đặt lại mật khẩu" />
          <CardBody>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
              Nhập email, mã OTP khôi phục và mật khẩu mới để truy cập lại hệ thống.
            </p>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <FormField
                label="Email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <FormField
                label="Mã OTP khôi phục"
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={loading}
              />
              <FormField
                label="Mật khẩu mới"
                type="password"
                required
                placeholder="8–15 ký tự, có chữ hoa, số và ký tự đặc biệt"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <FormField
                label="Xác nhận mật khẩu mới"
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </form>
          </CardBody>
          <CardFooter style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <><Spinner /> Đang cập nhật...</> : 'Đặt lại mật khẩu'}
            </Button>
            <Button variant="secondary" onClick={() => router.push('/forgot-password')}>Chưa nhận mã OTP?</Button>
            <Button variant="ghost" onClick={() => router.push('/')}>Quay lại trang chủ</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
