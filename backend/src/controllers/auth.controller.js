const AuthService = require('../services/auth.service');
const { success } = require('../utils/response');
const prisma = require('../config/prisma');

/**
 * Auth Controller – thin layer that delegates to AuthService.
 */
const AuthController = {
  /**
   * POST /api/auth/register
   * ND-01: Bệnh nhân đăng ký tài khoản.
   */
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      await prisma.audit_logs.create({
        data: {
          user_id: result.id ? BigInt(result.id) : null,
          action: 'REGISTER',
          entity_type: 'users',
          entity_id: result.id ? BigInt(result.id) : null,
          ip_address: req.ip || '127.0.0.1',
          new_value: { email: result.email }
        }
      }).catch(err => console.error('Register log error:', err));
      return success(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/verify-email
   * ND-01: Xác thực email đăng ký.
   */
  async verifyEmail(req, res, next) {
    try {
      const result = await AuthService.verifyEmail(req.body);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   * ND-02: Đăng nhập.
   */
  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      const userId = result.user?.id || result.id;
      if (userId) {
        await prisma.audit_logs.create({
          data: {
            user_id: BigInt(userId),
            action: 'LOGIN',
            entity_type: 'users',
            entity_id: BigInt(userId),
            ip_address: req.ip || '127.0.0.1',
            new_value: { email: req.body.email, mfa_required: !!result.requires_mfa }
          }
        }).catch(err => console.error('Login log error:', err));
      }
      return success(res, result);
    } catch (err) {
      await prisma.audit_logs.create({
        data: {
          user_id: null,
          action: 'LOGIN_FAILED',
          entity_type: 'users',
          entity_id: null,
          ip_address: req.ip || '127.0.0.1',
          new_value: { email: req.body.email, error: err.message }
        }
      }).catch(lErr => console.error('Login failed log error:', lErr));
      next(err);
    }
  },

  /**
   * POST /api/auth/mfa/verify
   * ND-02: Xác thực MFA (bước 2).
   */
  async verifyMfa(req, res, next) {
    try {
      const result = await AuthService.verifyMfa({
        userId: req.user.id,
        otp_code: req.body.otp_code,
      });
      const userId = result.user?.id || req.user.id;
      await prisma.audit_logs.create({
        data: {
          user_id: BigInt(userId),
          action: 'MFA_VERIFY',
          entity_type: 'users',
          entity_id: BigInt(userId),
          ip_address: req.ip || '127.0.0.1',
          new_value: { status: 'SUCCESS' }
        }
      }).catch(err => console.error('MFA verify log error:', err));
      return success(res, result);
    } catch (err) {
      await prisma.audit_logs.create({
        data: {
          user_id: req.user?.id ? BigInt(req.user.id) : null,
          action: 'MFA_VERIFY_FAILED',
          entity_type: 'users',
          entity_id: req.user?.id ? BigInt(req.user.id) : null,
          ip_address: req.ip || '127.0.0.1',
          new_value: { error: err.message }
        }
      }).catch(lErr => console.error('MFA verify failed log error:', lErr));
      next(err);
    }
  },

  /**
   * POST /api/auth/change-password
   * ND-04: Đổi mật khẩu.
   */
  async changePassword(req, res, next) {
    try {
      const result = await AuthService.changePassword({
        userId: req.user.id,
        current_password: req.body.current_password,
        new_password: req.body.new_password,
      });
      await prisma.audit_logs.create({
        data: {
          user_id: BigInt(req.user.id),
          action: 'CHANGE_PASSWORD',
          entity_type: 'users',
          entity_id: BigInt(req.user.id),
          ip_address: req.ip || '127.0.0.1'
        }
      }).catch(err => console.error('Change password log error:', err));
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/forgot-password
   * ND-05: Quên mật khẩu (gửi OTP).
   */
  async forgotPassword(req, res, next) {
    try {
      const result = await AuthService.forgotPassword(req.body);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/reset-password
   * ND-05: Đặt lại mật khẩu bằng OTP.
   */
  async resetPassword(req, res, next) {
    try {
      const result = await AuthService.resetPassword(req.body);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/mfa/setup
   * Bật MFA cho user.
   */
  async setupMfa(req, res, next) {
    try {
      const result = await AuthService.setupMfa({ userId: req.user.id });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/mfa/disable
   * Tắt MFA cho user.
   */
  async disableMfa(req, res, next) {
    try {
      const result = await AuthService.disableMfa({ userId: req.user.id });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   * Đăng xuất.
   */
  async logout(req, res, next) {
    try {
      const result = await AuthService.logout();
      if (req.user?.id) {
        await prisma.audit_logs.create({
          data: {
            user_id: BigInt(req.user.id),
            action: 'LOGOUT',
            entity_type: 'users',
            entity_id: BigInt(req.user.id),
            ip_address: req.ip || '127.0.0.1'
          }
        }).catch(err => console.error('Logout log error:', err));
      }
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
