const UserService = require('../services/user.service');
const { success } = require('../utils/response');

/**
 * User Controller – thin layer that delegates to UserService.
 * Tất cả API đều yêu cầu quyền Admin.
 */
const UserController = {
  /**
   * POST /api/users
   * ND-01: Admin tạo tài khoản nhân viên y tế.
   */
  async create(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      return success(res, user, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users
   * Lấy danh sách người dùng.
   */
  async findAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const result = await UserService.findAll(page, limit);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/:id
   * Lấy chi tiết người dùng.
   */
  async findById(req, res, next) {
    try {
      const user = await UserService.findById(req.params.id);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/users/:id
   * Cập nhật thông tin người dùng.
   */
  async update(req, res, next) {
    try {
      const user = await UserService.update(req.params.id, req.body);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/users/:id
   * Xóa người dùng.
   */
  async delete(req, res, next) {
    try {
      const result = await UserService.delete(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/users/:id/role
   * ND-03: Gán vai trò cho người dùng.
   */
  async assignRole(req, res, next) {
    try {
      const user = await UserService.assignRole(req.params.id, req.body.role);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
