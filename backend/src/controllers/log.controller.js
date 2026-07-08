const LogService = require('../services/log.service');
const { success } = require('../utils/response');

/**
 * Log Controller – thin layer that routes HTTP requests to LogService.
 * Tất cả các tác vụ đều yêu cầu quyền ADMIN.
 */
const LogController = {
  /**
   * GET /api/logs
   * Lấy danh sách audit logs (Có phân trang, bộ lọc).
   */
  async findAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const userId = req.query.user_id || null;
      const action = req.query.action || null;

      const result = await LogService.findAll(page, limit, userId, action);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logs/export
   * Xuất báo cáo audit logs ra file CSV (AL-03).
   */
  async exportCSV(req, res, next) {
    try {
      // Lấy tối đa 1000 bản ghi audit log để xuất file
      const result = await LogService.findAll(1, 1000);
      
      // Định nghĩa tiêu đề cột
      let csv = 'ID,User ID,Username,Full Name,Role,Patient ID,Action,Entity Type,Entity ID,IP Address,Break Glass,Break Glass Reason,Created At\n';
      
      result.logs.forEach(log => {
        csv += `${log.id},` +
               `"${log.user_id || ''}",` +
               `"${log.users?.username || ''}",` +
               `"${log.users?.full_name || ''}",` +
               `"${log.users?.role_ref?.name || ''}",` +
               `"${log.patient_id || ''}",` +
               `"${log.action || ''}",` +
               `"${log.entity_type || ''}",` +
               `"${log.entity_id || ''}",` +
               `"${log.ip_address || ''}",` +
               `"${log.break_glass || false}",` +
               `"${log.break_glass_reason || ''}",` +
               `"${log.created_at}"\n`;
      });

      // Trả về file CSV với BOM UTF-8 để Excel đọc đúng tiếng Việt có dấu
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=Audit-Logs.csv');
      return res.send('\uFEFF' + csv);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = LogController;
