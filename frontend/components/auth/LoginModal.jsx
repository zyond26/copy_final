'use client';

import { useState, useEffect } from 'react';
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
  
  // Locked Account countdown timer
  const [lockCountdown, setLockCountdown] = useState(0);

  useEffect(() => {
    if (lockCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown]);

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
      if (err.seconds_left) {
        setLockCountdown(err.seconds_left);
      }
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

  const displayError = lockCountdown > 0 
    ? `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau: ${Math.floor(lockCountdown / 60)} phút ${(lockCountdown % 60).toString().padStart(2, '0')} giây.`
    : error;

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
        {(displayError || error) && <Alert variant="danger">{displayError || error}</Alert>}
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
                disabled={loading || lockCountdown > 0}
              />
              <FormField
                label="Mật khẩu"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || lockCountdown > 0}
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
              disabled={loading || lockCountdown > 0}
              maxLength="6"
            />
          )}

          <button
            type="submit"
            disabled={loading || lockCountdown > 0}
            className="btn btn--primary"
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <Spinner /> Đang xử lý...
              </>
            ) : lockCountdown > 0 ? (
              `⚠️ Đang khóa (${Math.floor(lockCountdown / 60)}:${(lockCountdown % 60).toString().padStart(2, '0')})`
            ) : (
              requiresMfa ? '✓ Xác Thực' : '🔓 Đăng Nhập'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          {!requiresMfa && (
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
          )}
        </div>
      </div>
    </Modal>
  );
}
