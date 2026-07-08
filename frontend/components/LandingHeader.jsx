'use client';

import { useState } from 'react';
import LoginModal from './auth/LoginModal';
import SignupModal from './auth/SignupModal';
import styles from './LandingHeader.module.css';

export default function LandingHeader() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleSignupClick = () => {
    setShowLoginModal(false); // Đóng login modal nếu mở
    setShowSignupModal(true);
  };

  const handleLoginClick = () => {
    setShowSignupModal(false); // Đóng signup modal nếu mở
    setShowLoginModal(true);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <span>⚕️</span>
            </div>
            <div className={styles.logoText}>
              <h1>Mini EMR</h1>
              <p>Quản lý bệnh án điện tử ISO 27799</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className={styles.nav}>
            <a href="#tin-tuc">Tin tức</a>
            <a href="#canh-bao">Cảnh báo</a>
            <a href="#gioi-thieu">Giới thiệu</a>
          </nav>

          {/* Auth Buttons */}
          <div className={styles.authButtons}>
            <button
              onClick={handleLoginClick}
              className="btn btn--secondary"
              aria-label="Đăng nhập tài khoản"
            >
              Đăng nhập
            </button>
            <button
              onClick={handleSignupClick}
              className="btn btn--primary"
              aria-label="Đăng ký tài khoản mới"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSignupClick={handleSignupClick}
      />
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)}
        onLoginClick={handleLoginClick}
      />
    </>
  );
}
