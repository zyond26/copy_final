/**
 * Global error handling middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (err, _req, res, _next) => {
  console.error('[Error]', err);

  // Prisma known‑request error (e.g. unique constraint violation)
  if (err.code === 'P2002') {
    const target = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({
      status: 'error',
      message: `Dữ liệu bị trùng: ${target} đã tồn tại.`,
    });
  }

  // Prisma known‑request error: Record to delete/update does not exist
  if (err.code === 'P2025') {
    return res.status(404).json({
      status: 'error',
      message: 'Không tìm thấy bản ghi yêu cầu.',
    });
  }

  // Prisma known‑request error: Foreign key constraint failed
  if (err.code === 'P2003') {
    return res.status(400).json({
      status: 'error',
      message: 'Yêu cầu không hợp lệ. Bản ghi liên kết không tồn tại (Ví dụ: ID Bệnh nhân hoặc Bác sĩ không hợp lệ).',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    seconds_left: err.secondsLeft,
  });
};

module.exports = errorHandler;
