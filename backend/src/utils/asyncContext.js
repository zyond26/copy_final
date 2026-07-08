const { AsyncLocalStorage } = require('node:async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

const getRequestContext = () => {
  const store = asyncLocalStorage.getStore();
  if (!store) return {};

  return {
    userId: store.req?.user?.id || store.userId || null,
    patientId: store.req?.params?.patientId || store.req?.body?.patientId || store.patientId || null,
    ipAddress: store.req?.ip || store.req?.socket?.remoteAddress || store.ipAddress || null,
    requestId: store.requestId,
    breakGlass: store.breakGlass,
    breakGlassReason: store.breakGlassReason,
  };
};

// Sử dụng chủ yếu ở Middleware để khởi tạo context cho toàn bộ Request
const runWithContext = (context, callback) => {
  return asyncLocalStorage.run(context, callback);
};

// ====================== BREAK GLASS HELPER ======================
/**
 * Thực thi một hành động với quyền truy cập khẩn cấp (Break Glass)
 * BẮT BUỘC phải truyền lý do để ghi Audit Log.
 * @param {string} reason - Lý do phá kính (bắt buộc)
 * @param {Function} callback - Đoạn code (async/sync) cần thực thi dưới quyền khẩn cấp
 */
const withBreakGlass = async (reason, callback) => {
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    throw new Error('[Security] Break Glass reason is strictly required.');
  }

  const store = asyncLocalStorage.getStore() || {};
  const breakGlassContext = {
    ...store,
    breakGlass: true,
    breakGlassReason: reason.trim(),
  };

  // Các thao tác database bên trong callback này SẼ nhận được context break_glass
  return runWithContext(breakGlassContext, callback);
};

module.exports = {
  getRequestContext,
  runWithContext,
  withBreakGlass,
};