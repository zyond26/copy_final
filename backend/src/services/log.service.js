const prisma = require('../config/prisma');

/**
 * Log Service – business logic layer for retrieving system audit logs (AL-02).
 */
const LogService = {
  /**
   * Lấy danh sách toàn bộ audit logs.
   * Hỗ trợ phân trang, lọc theo user hoặc action.
   */
  async findAll(page = 1, limit = 10, userId = null, action = null) {
    const skip = (page - 1) * limit;
    const whereClause = {};

    if (userId) {
      whereClause.user_id = BigInt(userId);
    }
    if (action) {
      whereClause.action = action.trim().toUpperCase();
    }

    const [logs, total] = await prisma.$transaction([
      prisma.audit_logs.findMany({
        where: whereClause,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
              role_ref: { select: { name: true } },
            },
          },
          patients: {
            select: {
              id: true,
              patient_code: true,
              full_name: true,
            },
          },
        },
      }),
      prisma.audit_logs.count({ where: whereClause }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        id: log.id.toString(),
        user_id: log.user_id ? log.user_id.toString() : null,
        patient_id: log.patient_id ? log.patient_id.toString() : null,
        entity_id: log.entity_id ? log.entity_id.toString() : null,
        users: log.users ? { ...log.users, id: log.users.id.toString() } : null,
        patients: log.patients ? { ...log.patients, id: log.patients.id.toString() } : null,
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },
};

module.exports = LogService;
