const prisma = require('../config/prisma');

// Lấy danh sách Audit Logs (có filter + phân trang)
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      fromDate,
      toDate,
      action,
      entity_type,
      user_id,
      patient_id,
      break_glass
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;
    if (user_id) where.user_id = BigInt(user_id);
    if (patient_id) where.patient_id = BigInt(patient_id);
    if (break_glass !== undefined) where.break_glass = break_glass === 'true';

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          users: { select: { id: true, full_name: true, email: true } },
          patients: { select: { id: true, full_name: true } }
        }
      }),
      prisma.audit_logs.count({ where })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Báo cáo thống kê theo Action
exports.getAuditSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const where = {};
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }

    const summary = await prisma.audit_logs.groupBy({
      by: ['action'],
      where,
      _count: { action: true }
    });

    res.json({
      success: true,
      data: summary.map(s => ({ action: s.action, count: s._count.action }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Export CSV
exports.exportAuditLogs = async (req, res) => {
  try {
    const { fromDate, toDate, action, entity_type } = req.query;
    const where = {};
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;

    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { full_name: true } },
        patients: { select: { full_name: true } }
      }
    });

    let csv = 'ID,Thời gian,Action,Entity Type,Entity ID,User,Patient,Break Glass,IP,Status\n';
    logs.forEach(log => {
      csv += `${log.id},${log.created_at},${log.action},${log.entity_type},${log.entity_id},${log.users?.full_name || ''},${log.patients?.full_name || ''},${log.break_glass},${log.ip_address || ''},${log.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi export' });
  }
};