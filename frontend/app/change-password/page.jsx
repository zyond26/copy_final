'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, FormField, Card, CardHeader, CardBody, CardFooter,
  Alert, Spinner,
} from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ các trường mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    const token = localStorage.getItem('access_token');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Không thể đổi mật khẩu.');
      }

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, must_change_password: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Đổi mật khẩu thành công! Đang chuyển về bảng điều khiển...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const isForced = user?.must_change_password;

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
          <h1 style={{ color: 'var(--color-primary-deep)', margin: 0, fontWeight: 800 }}>
            {isForced ? 'Đổi Mật Khẩu Bắt Buộc' : 'Đổi Mật Khẩu'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {isForced
              ? 'Mật khẩu của bạn đã quá 3 tháng. Vui lòng đặt mật khẩu mới để tiếp tục sử dụng hệ thống.'
              : 'Theo chính sách ISO 27799, mật khẩu phải được đổi ít nhất 3 tháng một lần.'}
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Card>
          <CardHeader title="Thông tin mật khẩu mới" />
          <form onSubmit={handleSubmit}>
            <CardBody>
              <FormField
                label="Mật khẩu hiện tại"
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <FormField
                label="Mật khẩu mới"
                type="password"
                required
                placeholder="8–15 ký tự, có chữ hoa, số và ký tự đặc biệt"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <FormField
                label="Xác nhận mật khẩu mới"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </CardBody>
            <CardFooter style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              {!isForced && (
                <Button type="button" variant="secondary" onClick={() => router.push('/dashboard')} disabled={loading}>
                  Quay lại
                </Button>
              )}
              <Button type="submit" disabled={loading} style={{ flex: isForced ? 1 : undefined }}>
                {loading ? <Spinner /> : 'Đổi mật khẩu'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
