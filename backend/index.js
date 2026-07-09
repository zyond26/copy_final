// //fix bigint
// BigInt.prototype.toJSON = function () {
//     return this.toString();
//     };

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const setupSwagger = require('./src/config/swagger');
// const routes = require('./src/routes');
// const errorHandler = require('./src/middlewares/errorHandler');

// const setAuditContext = require('./src/middlewares/auditContext');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Tin tưởng 1 lớp proxy (Render/Nginx...) để rate-limit lấy đúng IP client
// app.set('trust proxy', 1);

// // ── Global Middlewares ──────────────────────────────────────
// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   'http://localhost:3000',
//   'http://localhost:3001',
//   'http://localhost:5173',
// ].filter(Boolean);

// app.use(cors({
//   origin: (origin, callback) => {
//     // Cho phép các request không có origin (như Postman, công cụ test hoặc app di động)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       const msg = 'Chính sách CORS của hệ thống y tế không cho phép truy cập từ origin này.';
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true,
// }));
// app.use(express.json());

// // middle audit context
// app.use(setAuditContext);

// // ── Swagger UI ──────────────────────────────────────────────
// setupSwagger(app);

// // ── API Routes ──────────────────────────────────────────────
// app.use('/api', routes);

// // ── Health Check ────────────────────────────────────────────
// app.get('/', (_req, res) => {
//   res.json({ status: 'ok', message: 'Mini EMR API is running.' });
// });

// // ── Global Error Handler (phải đặt SAU tất cả routes) ──────
// app.use(errorHandler);

// // ── Start Server ────────────────────────────────────────────
// app.listen(PORT, () => {
//   console.log(`[Server] Running on http://localhost:${PORT}`);
// });

// ------ new version to implement ------ 

//fix bigint
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// ⚠️ ĐẢM BẢO ĐƯỜNG DẪN ĐÚNG: Vì file này nằm ở ngoài cùng thư mục /backend 
// nên nếu các thư mục con nằm trong /backend/config hoặc /backend/routes 
// thì bạn chỉ cần ghi './config/...' hoặc './routes' thay vì './src/...'
// Bạn hãy check lại xem thư mục của mình có chữ 'src' không nhé. 
// Nếu cấu hình của bạn là backend/src/config thì giữ nguyên, nếu là backend/config thì bỏ chữ 'src/'.
const setupSwagger = require('./src/config/swagger');
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');
const setAuditContext = require('./src/middlewares/auditContext');

const app = express();

app.disable('x-powered-by');

// Tin tưởng 1 lớp proxy (Render sử dụng cơ chế reverse proxy nên BẮT BUỘC phải có dòng này)
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  })
);

// ── CẤU HÌNH CORS ĐỂ CHẠY PRODUCTION ─────────────────────────
// app.use(cors({
//   origin: (origin, callback) => {
//     // 1. Trên môi trường production, một số request (như từ các công cụ kiểm thử, backend gọi nhau, hoặc một số trình duyệt cũ) origin sẽ bị undefined.
//     // 2. Cho phép FRONTEND_URL từ biến môi trường của Render.
//     if (!origin) return callback(null, true);

//     const allowedOrigins = [
//       process.env.FRONTEND_URL,
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://localhost:5173',
//     ].filter(Boolean);

//     // Kiểm tra xem origin của request có nằm trong danh sách cho phép không
//     // 💡 Mẹo: Thêm điều kiện render.com để tránh lỗi cấu hình nhầm string whitespace
//     if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.render.com')) {
//       return callback(null, true);
//     } else {
//       const msg = `Chính sách CORS của hệ thống y tế không cho phép truy cập từ origin: ${origin}`;
//       return callback(new Error(msg), false);
//     }
//   },
//   credentials: true,
// }));

// Thay vì dùng allowedOrigins phức tạp, tạm thời sửa thành:
app.use(cors({
  origin: true, // Cho phép TẤT CẢ các bên gọi tới (Cả local và Render Frontend)
  credentials: true,
}));

app.use(express.json());

// middle audit context
app.use(setAuditContext);

// ── Swagger UI ──────────────────────────────────────────────
setupSwagger(app);

// ── API Routes ──────────────────────────────────────────────
app.use('/api', routes);

// ── Health Check ────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Mini EMR API is running.' });
});

// ── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────
// Đã chuẩn cấu hình PORT động cho Render nhận diện!
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});