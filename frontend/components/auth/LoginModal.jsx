'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import styles from './AuthModal.module.css';

export default function LoginModal({ isOpen, onClose, onSignupClick }) {
  const router = useRouter();
  const { login, verifyMfa } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // MFA state
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await login(email, password);
      if (result.requiresMfa) {
        setTempToken(result.temporaryToken || '');
        setRequiresMfa(true);
        setSuccess('Mã MFA đã được gửi. Vui lòng kiểm tra email.');
        setEmail('');
        setPassword('');
      } else {
        setSuccess('✓ Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onClose();
          setEmail('');
          setPassword('');
          setOtpCode('');
          setRequiresMfa(false);
        }, 1000);
      }
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Vui lòng nhập mã MFA.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyMfa(otpCode, tempToken);
      setSuccess('✓ Xác thực thành công! Đang vào tài khoản...');
      setTimeout(() => {
        onClose();
        setEmail('');
        setPassword('');
        setOtpCode('');
        setTempToken('');
        setRequiresMfa(false);
      }, 1000);
    } catch (err) {
      setError(err?.message || 'Xác thực MFA thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2>
            {requiresMfa ? '🔐 Xác Thực MFA' : '🚪 Đăng Nhập'}
          </h2>
          <p>
            {requiresMfa
              ? 'Nhập mã xác thực 6 số'
              : 'Truy cập tài khoản Mini EMR của bạn'}
          </p>
        </div>

        {/* Alerts */}
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Form */}
        <form onSubmit={requiresMfa ? handleMfaVerify : handleLogin} className={styles.form}>
          {!requiresMfa ? (
            <>
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
                label="Mật khẩu"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </>
          ) : (
            <FormField
              label="Mã xác thực (6 số)"
              type="text"
              required
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              maxLength="6"
            />
          )}

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
              requiresMfa ? '✓ Xác Thực' : '🔓 Đăng Nhập'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          {!requiresMfa && (
            <>
              <div style={{ marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className={styles.switchLink}
                  style={{ marginRight: '1rem' }}
                >
                  Quên mật khẩu?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setError('');
                    setSuccess('');
                    setTimeout(onSignupClick, 200);
                  }}
                  className={styles.switchLink}
                >
                  Chưa có tài khoản? Đăng ký
                </button>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--color-border)' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary-deep)', marginBottom: '0.5rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tài Khoản Kiểm Thử Nhanh (Demo Accounts)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', textAlign: 'left' }}>
                  {[
                    { label: 'Quản Trị Viên (Admin)', email: 'admin@example.com' },
                    { label: 'Bác Sĩ (Doctor)', email: 'doctor@example.com' },
                    { label: 'Điều Dưỡng (Nurse)', email: 'nurse@example.com' },
                    { label: 'Lễ Tân (Receptionist)', email: 'receptionist@example.com' },
                    { label: 'Bệnh Nhân (Patient)', email: 'patient@example.com' },
                  ].map(({ label, email }) => (
                    <button
                      key={email}
                      type="button"
                      className="btn btn--secondary"
                      style={{ padding: '6px 8px', fontSize: '10px', height: 'auto', minHeight: 'unset', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: '1px solid var(--color-border)', borderRadius: '4px', background: '#fcfbf7', cursor: 'pointer' }}
                      onClick={() => {
                        setEmail(email);
                        setPassword('Password123!');
                      }}
                    >
                      <strong style={{ fontSize: '10px', color: 'var(--color-text)' }}>{label}</strong>
                      <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>{email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
