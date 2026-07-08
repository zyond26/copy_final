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


//fix bigint
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // 1. THÊM DÒNG NÀY ───
require('dotenv').config();

const setupSwagger = require('./src/config/swagger');
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');
const setAuditContext = require('./src/middlewares/auditContext');

const app = express();
// const PORT = process.env.PORT || 3000;

// 2. VÁ LỖI "Server Leaks Information via X-Powered-By"
app.disable('x-powered-by');

// Tin tưởng 1 lớp proxy (Render/Nginx...) để rate-limit lấy đúng IP client
app.set('trust proxy', 1);

// 3. THÊM CẤU HÌNH HELMET Ở ĐÂY (Vá lỗi CSP, Anti-clickjacking, X-Content-Type-Options)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Cho phép chạy các script nội bộ của Swagger UI không bị chặn lỗi trắng trang
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
    // Vá lỗi Anti-clickjacking
    frameguard: { action: 'deny' },
    // Vá lỗi X-Content-Type-Options
    noSniff: true,
  })
);

// ── Global Middlewares ──────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'Chính sách CORS của hệ thống y tế không cho phép truy cập từ origin này.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
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

// ── Global Error Handler (phải đặt SAU tất cả routes) ──────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// app.listen(PORT, () => {
//   console.log(`[Server] Running on http://localhost:${PORT}`);
// });