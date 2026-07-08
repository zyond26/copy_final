const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { isPasswordExpired } = require('../utils/passwordPolicy');

// Các endpoint được phép khi mật khẩu đã hết hạn
const PASSWORD_EXPIRY_EXEMPT = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password',
  '/auth/logout',
  '/auth/mfa/verify',
];

/**
 * Authentication & Authorization Middleware (RBAC theo DB).
 *
 * Phân quyền dựa trên bảng roles / permissions / role_permissions.
 * Quyền của mỗi vai trò được nạp từ DB và cache trong bộ nhớ để tránh
 * truy vấn lặp ở mỗi request (ISO 27799 §9.1.2, §9.6.1).
 */

// ─── Cache role → Set(permission names) ─────────────────────
const CACHE_TTL_MS = 60 * 1000; // 60s: đủ để thay đổi seed lan ra nhanh
let permCache = new Map();      // roleName -> Set<string>
let permCacheLoadedAt = 0;

async function loadRolePermissions() {
  const roles = await prisma.roles.findMany({
    include: { role_permissions: { include: { permission: true } } },
  });
  const map = new Map();
  for (const role of roles) {
    map.set(role.name, new Set(role.role_permissions.map((rp) => rp.permission.name)));
  }
  permCache = map;
  permCacheLoadedAt = Date.now();
}

async function getPermissionsForRole(roleName) {
  if (Date.now() - permCacheLoadedAt > CACHE_TTL_MS || permCache.size === 0) {
    await loadRolePermissions();
  }
  return permCache.get(roleName) || new Set();
}

/** Xóa cache thủ công (gọi sau khi thay đổi phân quyền). */
function clearPermissionCache() {
  permCache = new Map();
  permCacheLoadedAt = 0;
}

// ─── authenticate: xác thực JWT ─────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Không có token xác thực. Vui lòng đăng nhập.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Token không hợp lệ.',
    });
  }
};

/**
 * authorize: kiểm tra quyền (permission) của người dùng.
 * Dùng SAU authenticate. Cho phép truy cập nếu vai trò của user
 * có ÍT NHẤT MỘT trong các permission yêu cầu.
 *
 * @param  {...string} requiredPermissions - vd: 'patient:create'
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/', authenticate, authorize('patient:create'), Ctrl.create);
 */
const authorize = (...requiredPermissions) => {
  // Hỗ trợ cả khi truyền mảng: authorize(['a','b'])
  const required = requiredPermissions.flat();

  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ status: 'error', message: 'Chưa xác thực.' });
    }

    try {
      const granted = await getPermissionsForRole(req.user.role);
      const ok = required.some((p) => granted.has(p));
      if (!ok) {
        return res.status(403).json({
          status: 'error',
          message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: ${required.join(' hoặc ')}.`,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * enforcePasswordFresh: chặn API khi mật khẩu quá 3 tháng chưa đổi.
 * Cho phép đổi mật khẩu và đăng xuất; bỏ qua request không có token.
 */
const enforcePasswordFresh = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const apiPath = req.originalUrl.split('?')[0].replace(/^\/api/, '');
  if (PASSWORD_EXPIRY_EXEMPT.some((p) => apiPath === p || apiPath.startsWith(`${p}/`))) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token MFA tạm thời – chưa hoàn tất đăng nhập
    if (decoded.purpose === 'mfa') {
      return next();
    }

    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.id) },
      select: { password_changed_at: true, created_at: true },
    });

    if (user && isPasswordExpired(user)) {
      return res.status(403).json({
        status: 'error',
        code: 'PASSWORD_EXPIRED',
        message: 'Mật khẩu đã hết hạn (quá 3 tháng). Vui lòng đổi mật khẩu trước khi tiếp tục.',
        must_change_password: true,
      });
    }

    return next();
  } catch {
    // Token không hợp lệ – để authenticate xử lý
    return next();
  }
};

module.exports = { authenticate, authorize, clearPermissionCache, enforcePasswordFresh };
