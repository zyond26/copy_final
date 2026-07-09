const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { getCurrentTime } = require('../utils/time');

const SALT_ROUNDS = 10;

/**
 * User Service – business logic cho quản lý người dùng (Admin only).
 */
const UserService = {
  /**
   * ND-01: Admin tạo tài khoản nhân viên y tế.
   * Tài khoản được tạo với status ACTIVE (không cần verify email).
   */
  async create({ email, password, full_name, username, role, citizen_id }) {
    // Kiểm tra email đã tồn tại
    const existingEmail = await prisma.users.findUnique({ where: { email } });
    if (existingEmail) {
      const err = new Error('Email đã được sử dụng.');
      err.statusCode = 409;
      throw err;
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await prisma.users.findUnique({ where: { username } });
    if (existingUsername) {
      const err = new Error('Username đã được sử dụng.');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const roleName = role.toUpperCase();
    const user = await prisma.users.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        full_name: full_name.trim(),
        // Vai trò qua role_id (chuẩn hóa, roles.name là unique)
        role_ref: { connect: { name: roleName } },
        citizen_id: citizen_id?.trim() || null,
        status: 'ACTIVE',
        mfa_enabled: true,
        password_changed_at: getCurrentTime(),
      },
      include: { role_ref: true },
    });

    return UserService.serialize(user);
  },

  /**
   * Lấy danh sách người dùng (phân trang).
   */
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.users.findMany({
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          full_name: true,
          role_ref: { select: { name: true } },
          status: true,
          mfa_enabled: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.users.count(),
    ]);

    return {
      users: users.map(UserService.serialize),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },

  /**
   * Lấy chi tiết người dùng theo ID.
   */
  async findById(id) {
    const user = await prisma.users.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        citizen_id: true,
        role_ref: { select: { name: true } },
        status: true,
        mfa_enabled: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    return UserService.serialize(user);
  },

  /**
   * Cập nhật thông tin người dùng.
   */
  async update(id, data) {
    const user = await prisma.users.findUnique({ where: { id: BigInt(id) } });
    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    const updateData = { updated_at: getCurrentTime() };

    if (data.email) updateData.email = data.email.trim().toLowerCase();
    if (data.full_name) updateData.full_name = data.full_name.trim();
    if (data.role) {
      updateData.role_ref = { connect: { name: data.role.toUpperCase() } }; // vai trò qua role_id
    }
    if (data.status) updateData.status = data.status.toUpperCase();
    if (data.citizen_id !== undefined) updateData.citizen_id = data.citizen_id?.trim() || null;

    const updated = await prisma.users.update({
      where: { id: BigInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        citizen_id: true,
        role_ref: { select: { name: true } },
        status: true,
        mfa_enabled: true,
        created_at: true,
        updated_at: true,
      },
    });

    return UserService.serialize(updated);
  },

  /**
   * Xóa người dùng.
   */
  async delete(id) {
    const user = await prisma.users.findUnique({ where: { id: BigInt(id) } });
    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.users.delete({ where: { id: BigInt(id) } });

    return { message: 'Xóa người dùng thành công.' };
  },

  /**
   * ND-03: Gán vai trò cho người dùng.
   */
  async assignRole(id, role) {
    const user = await prisma.users.findUnique({ where: { id: BigInt(id) } });
    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    const roleName = role.toUpperCase();
    const updated = await prisma.users.update({
      where: { id: BigInt(id) },
      data: {
        role_ref: { connect: { name: roleName } }, // vai trò qua role_id
        updated_at: getCurrentTime(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role_ref: { select: { name: true } },
        status: true,
        updated_at: true,
      },
    });

    return UserService.serialize(updated);
  },

  /**
   * Serialize: BigInt → string và làm phẳng role_ref.name thành trường `role`
   * (giữ nguyên hình dạng response cho client).
   */
  serialize(user) {
    const { role_ref, ...rest } = user;
    return {
      ...rest,
      id: user.id.toString(),
      role: role_ref?.name ?? null,
    };
  },
};

module.exports = UserService;
