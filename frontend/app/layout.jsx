import { Be_Vietnam_Pro } from 'next/font/google';
import { AuthProvider } from '@/src/context/AuthContext';
import './globals.css';

// Font chính của toàn hệ thống – hỗ trợ dấu tiếng Việt chuẩn
const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
});

export const metadata = {
  title: 'Mini EMR - ISO 27799 Compliant',
  description: 'Hệ thống bệnh án điện tử Mini EMR bảo mật chuẩn quốc tế',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
