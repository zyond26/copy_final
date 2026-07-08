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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Vui lòng nhập email để nhận mã khôi phục.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess('Nếu email tồn tại, mã OTP khôi phục đã được gửi. Vui lòng kiểm tra hộp thư đến.');
    } catch (err) {
      setError(err.message || 'Có lỗi khi gửi yêu cầu quên mật khẩu.');
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
          <CardHeader title="Quên mật khẩu" />
          <CardBody>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
              Nhập email của bạn, chúng tôi sẽ gửi mã OTP để khôi phục mật khẩu.
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
            </form>
          </CardBody>
          <CardFooter style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <><Spinner /> Đang gửi...</> : 'Gửi mã khôi phục'}
            </Button>
            <Button variant="secondary" onClick={() => router.push('/reset-password')}>
              Tôi đã có mã OTP, đặt lại mật khẩu
            </Button>
            <Button variant="ghost" onClick={() => router.push('/')}>Quay lại trang chủ</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
