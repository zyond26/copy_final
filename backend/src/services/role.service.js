const prisma = require('../config/prisma');

const getAllRoles = async () => {
  return await prisma.roles.findMany({
    include: {
      role_permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
  });
};

const getRoleById = async (id) => {
  return await prisma.roles.findUnique({
    where: { id: parseInt(id) },
    include: {
      role_permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
  });
};

const createRole = async (name, description, permissionIds) => {
  return await prisma.$transaction(async (tx) => {
    // Check if role name already exists
    const existingRole = await tx.roles.findUnique({ where: { name } });
    if (existingRole) {
      throw new Error(`Vai trò '${name}' đã tồn tại.`);
    }

    // Verify all permissions exist
    const perms = await tx.permissions.findMany({
      where: { id: { in: permissionIds } },
    });
    if (perms.length !== permissionIds.length) {
      throw new Error('Một số quyền không hợp lệ hoặc không tồn tại.');
    }

    const newRole = await tx.roles.create({
      data: {
        name,
        description,
        role_permissions: {
          create: permissionIds.map((pid) => ({ permission_id: pid })),
        },
      },
      include: {
        role_permissions: { include: { permission: true } },
      },
    });

    return newRole;
  });
};

const updateRole = async (id, name, description, permissionIds) => {
  const roleId = parseInt(id);

  return await prisma.$transaction(async (tx) => {
    const role = await tx.roles.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new Error('Không tìm thấy vai trò.');
    }

    if (name && name !== role.name) {
      const existingRole = await tx.roles.findUnique({ where: { name } });
      if (existingRole) {
        throw new Error(`Vai trò '${name}' đã tồn tại.`);
      }
    }

    if (permissionIds) {
      const perms = await tx.permissions.findMany({
        where: { id: { in: permissionIds } },
      });
      if (perms.length !== permissionIds.length) {
        throw new Error('Một số quyền không hợp lệ hoặc không tồn tại.');
      }
    }

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;

    if (permissionIds) {
      // Xóa quyền cũ
      await tx.role_permissions.deleteMany({ where: { role_id: roleId } });
      
      // Thêm quyền mới
      data.role_permissions = {
        create: permissionIds.map((pid) => ({ permission_id: pid })),
      };
    }

    const updatedRole = await tx.roles.update({
      where: { id: roleId },
      data,
      include: {
        role_permissions: { include: { permission: true } },
      },
    });

    return updatedRole;
  });
};

const deleteRole = async (id) => {
  const roleId = parseInt(id);

  return await prisma.$transaction(async (tx) => {
    const role = await tx.roles.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new Error('Không tìm thấy vai trò.');
    }

    if (['ADMIN'].includes(role.name)) {
      throw new Error('Không thể xóa vai trò mặc định của hệ thống.');
    }

    if (role._count.users > 0) {
      throw new Error(`Không thể xóa vai trò '${role.name}' vì đang có ${role._count.users} người dùng được gán vai trò này.`);
    }

    await tx.role_permissions.deleteMany({ where: { role_id: roleId } });
    await tx.roles.delete({ where: { id: roleId } });

    return true;
  });
};

const getAllPermissions = async () => {
  return await prisma.permissions.findMany({
    orderBy: [
      { resource: 'asc' },
      { action: 'asc' },
    ],
  });
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
};
