'use client';
// test push
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import LandingHeader from '@/components/LandingHeader';
import MedicalInfoCard from '@/components/MedicalInfoCard';
import MedicalDetailModal from '@/components/MedicalDetailModal';
import { MEDICAL_NEWS } from '@/data/medicalNews';
import styles from './landing.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [selectedMedical, setSelectedMedical] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [fontSizeMode, setFontSizeMode] = useState('normal'); // 'normal' | 'large' | 'larger'

  // Chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (token && user) {
      if (user.must_change_password) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    }
  }, [token, user, router]);

  const handleOpenDetail = (medical) => {
    setSelectedMedical(medical);
    setShowDetailModal(true);
  };

  const getFontSizeClass = () => {
    if (fontSizeMode === 'large') return styles.fontLarge;
    if (fontSizeMode === 'larger') return styles.fontLarger;
    return '';
  };

  return (
    <div className={`${styles.page} ${getFontSizeClass()}`}>
      {/* Header */}
      <LandingHeader />

      {/* Font Size Accessibility Controller */}
      <div className={styles.accessibilityBar}>
        <div className={styles.accessibilityContainer}>
          <span>🎛️ Cỡ chữ (Font size):</span>
          <div className={styles.btnGroup}>
            <button 
              onClick={() => setFontSizeMode('normal')}
              className={`${styles.fontBtn} ${fontSizeMode === 'normal' ? styles.fontBtnActive : ''}`}
            >
              Mặc định (A)
            </button>
            <button 
              onClick={() => setFontSizeMode('large')}
              className={`${styles.fontBtn} ${fontSizeMode === 'large' ? styles.fontBtnActive : ''}`}
            >
              Lớn (A+)
            </button>
            <button 
              onClick={() => setFontSizeMode('larger')}
              className={`${styles.fontBtn} ${fontSizeMode === 'larger' ? styles.fontBtnActive : ''}`}
            >
              Rất lớn (A++)
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            🏥 Bảo Vệ Sức Khỏe Của Bạn
          </h1>
          <p className={styles.heroSubtitle}>
            Quản lý bệnh án điện tử với hệ thống bảo mật chuẩn quốc tế ISO 27799.
            Khám phá thông tin y tế mới nhất và cảnh báo các bệnh nguy hiểm.
          </p>
          <div className={styles.heroCta}>
            <a href="#tin-tuc" className="btn btn--secondary">
              📰 Xem Tin Tức Y Tế
            </a>
            <a href="#canh-bao" className="btn btn--primary">
              ⚠️ Cảnh Báo Sức Khỏe
            </a>
          </div>
        </div>
      </section>

      {/* ISO 27799 Explanation Section */}
      <section className={styles.isoSection}>
        <div className={styles.isoContainer}>
          <div className={styles.sectionHeader}>
            <h2>🛡️ Tiêu Chuẩn Bảo Mật Y Tế Quốc Tế ISO 27799</h2>
            <p>ISO 27799 là gì và vì sao hệ thống Mini EMR áp dụng tiêu chuẩn này?</p>
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: 'var(--color-text)', fontSize: 'var(--text-base)', lineHeight: 1.7 }}>
            <strong>ISO 27799 (Information security management in health using ISO/IEC 27002)</strong> là tiêu chuẩn quốc tế hướng dẫn chi tiết cách bảo vệ dữ liệu sức khỏe cá nhân (PHI). Tiêu chuẩn này đảm bảo hồ sơ bệnh án của bạn được quản lý an toàn, kiểm soát chặt chẽ quyền truy cập và sẵn sàng phục vụ điều trị khẩn cấp mà không làm rò rỉ thông tin cá nhân.
          </div>

          <div className={styles.isoGrid}>
            {/* Pillar 1 */}
            <div className={styles.isoCard}>
              <div className={styles.isoCardIcon}>🔐</div>
              <h3 className={styles.isoCardTitle}>Bảo mật & Phân quyền (RBAC)</h3>
              <p className={styles.isoCardDesc}>
                Phân quyền truy cập dựa trên vai trò nghiêm ngặt (Bác sĩ, Điều dưỡng, Lễ tân, Bệnh nhân). Bệnh nhân chỉ xem được hồ sơ của chính mình; bác sĩ chỉ được xem bệnh án tự mình tạo hoặc bệnh nhân được phân công.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className={styles.isoCard}>
              <div className={styles.isoCardIcon}>🔍</div>
              <h3 className={styles.isoCardTitle}>Nhật ký Kiểm toán (Audit Logs)</h3>
              <p className={styles.isoCardDesc}>
                Mọi hành động Đọc, Tạo, Sửa, Xóa hồ sơ y tế đều được ghi nhật ký hệ thống vĩnh viễn (Audit Trail) kèm IP người dùng. Dữ liệu này không thể bị sửa đổi hay xóa bỏ để phục vụ thanh tra an toàn thông tin.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className={styles.isoCard}>
              <div className={styles.isoCardIcon}>🚨</div>
              <h3 className={styles.isoCardTitle}>Truy cập Khẩn cấp (Break Glass)</h3>
              <p className={styles.isoCardDesc}>
                Cho phép y bác sĩ vượt rào cản phân quyền thông thường để truy cập hồ sơ bệnh nhân trong tình huống khẩn cấp đe dọa tính mạng. Mọi lần kích hoạt "Break Glass" đều yêu cầu lý do giải trình và tự động cảnh báo tới quản trị viên.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className={styles.isoCard}>
              <div className={styles.isoCardIcon}>💎</div>
              <h3 className={styles.isoCardTitle}>Mã hóa dữ liệu tại chỗ</h3>
              <p className={styles.isoCardDesc}>
                Các trường thông tin nhạy cảm của bệnh án như Triệu chứng, Chẩn đoán, Kết luận đều được mã hóa bằng thuật toán đối xứng mạnh trước khi lưu xuống cơ sở dữ liệu, chống rò rỉ dữ liệu ngay cả khi hệ thống bị xâm nhập vật lý.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Medical News Section */}
      <section id="tin-tuc" className={styles.newsSection}>
        <div className={styles.newsContainer}>
          <div className={styles.sectionHeader}>
            <h2>📰 Tin Tức Y Tế & Cảnh Báo Sức Khỏe</h2>
            <p>Cập nhật thông tin y khoa chính thống từ các chuyên gia giúp bảo vệ bản thân và gia đình</p>
          </div>

          {/* General News Sub-section */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className={styles.newsSubheader}>👥 Tin Tức Sức Khỏe Cộng Đồng</h3>
            <p className={styles.newsSubdesc}>Các bệnh lý phổ biến và phương pháp phòng ngừa chủ động dành cho mọi người</p>
            <div className={styles.cardsGrid}>
              {MEDICAL_NEWS.filter(item => item.category === 'GENERAL').map((medical) => (
                <MedicalInfoCard
                  key={medical.id}
                  {...medical}
                  onClick={() => handleOpenDetail(medical)}
                />
              ))}
            </div>
          </div>

          {/* Youth News Sub-section */}
          <div>
            <h3 className={styles.newsSubheader} style={{ color: '#1a7a3c', borderLeftColor: '#1a7a3c' }}>⚡ Góc Cảnh Báo Giới Trẻ</h3>
            <p className={styles.newsSubdesc}>Đặc biệt cảnh báo về nhịp sinh học, lối sống và các hội chứng văn phòng phổ biến</p>
            <div className={styles.cardsGrid}>
              {MEDICAL_NEWS.filter(item => item.category === 'YOUTH').map((medical) => (
                <MedicalInfoCard
                  key={medical.id}
                  {...medical}
                  onClick={() => handleOpenDetail(medical)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="canh-bao" className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.sectionHeader}>
            <h2>⚠️ Cảnh Báo Sức Khỏe Toàn Cầu</h2>
            <p>Những con số đáng lo ngại về tình hình sức khỏe hiện nay</p>
          </div>

          <div className={styles.statsGrid}>
            {/* Stat 1 */}
            <div className={`${styles.statCard} ${styles.statDanger}`}>
              <div className={styles.statNumber}>17 Triệu</div>
              <div className={styles.statText}>Người tử vong hàng năm do bệnh tim</div>
              <div className={styles.statNote}>Chiếm 31% tỷ lệ tử vong toàn cầu</div>
            </div>

            {/* Stat 2 */}
            <div className={`${styles.statCard} ${styles.statWarning}`}>
              <div className={styles.statNumber}>500M+</div>
              <div className={styles.statText}>Người bị tiểu đường toàn cầu</div>
              <div className={styles.statNote}>Tăng 3% mỗi năm, trẻ hóa nhanh</div>
            </div>

            {/* Stat 3 */}
            <div className={`${styles.statCard} ${styles.statInfo}`}>
              <div className={styles.statNumber}>12M+</div>
              <div className={styles.statText}>Đột quỵ mỗi năm trên thế giới</div>
              <div className={styles.statNote}>Nguyên nhân hàng đầu gây tàn tật</div>
            </div>

            {/* Stat 4 */}
            <div className={`${styles.statCard} ${styles.statSuccess}`}>
              <div className={styles.statNumber}>1 trong 3</div>
              <div className={styles.statText}>Phụ nữ trên 50 tuổi bị gãy xương</div>
              <div className={styles.statNote}>Do loãng xương không được phát hiện</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <div className={styles.sectionHeader}>
            <h2>🏥 Tính Năng Của Mini EMR</h2>
            <p>Quản lý bệnh án điện tử một cách an toàn và hiệu quả</p>
          </div>

          <div className={styles.featuresGrid}>
            {/* Feature 1 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Bảo Mật Chuẩn ISO 27799</h3>
              <p>Dữ liệu y tế của bạn được bảo vệ với tiêu chuẩn bảo mật quốc tế cao nhất</p>
            </div>

            {/* Feature 2 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📋</div>
              <h3>Quản Lý Bệnh Án Số</h3>
              <p>Lưu trữ đầy đủ thông tin bệnh án, toa thuốc, kết quả xét nghiệm một cách tổ chức</p>
            </div>

            {/* Feature 3 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⏰</div>
              <h3>Đặt Lịch Khám Dễ Dàng</h3>
              <p>Quản lý lịch khám, theo dõi tình trạng sức khỏe, nhận thông báo từ bệnh viện</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2>Bắt Đầu Quản Lý Sức Khỏe Của Bạn Hôm Nay</h2>
          <p>
            Đăng ký tài khoản Mini EMR miễn phí và truy cập vào hệ thống quản lý bệnh án an toàn
          </p>
          <button className="btn btn--secondary">
            ✍️ Đăng Ký Ngay
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerGrid}>
            <div>
              <h3>Mini EMR</h3>
              <p>Hệ thống quản lý bệnh án điện tử bảo mật theo chuẩn ISO 27799</p>
            </div>
            <div>
              <h4>Sản Phẩm</h4>
              <ul>
                <li><a href="#">Tính Năng</a></li>
                <li><a href="#">Giá Cả</a></li>
                <li><a href="#">Bảo Mật</a></li>
              </ul>
            </div>
            <div>
              <h4>Công Ty</h4>
              <ul>
                <li><a href="#">Giới Thiệu</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Liên Hệ</a></li>
              </ul>
            </div>
            <div>
              <h4>Pháp Lý</h4>
              <ul>
                <li><a href="#">Điều Khoản</a></li>
                <li><a href="#">Chính Sách Bảo Mật</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 Mini EMR. Bảo lưu mọi quyền. ISO 27799 Certified.</p>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <MedicalDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setTimeout(() => setSelectedMedical(null), 300);
        }}
        medicalInfo={selectedMedical}
      />
    </div>
  );
}
