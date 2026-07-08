/**
 * Seed RBAC – tạo roles, permissions, ánh xạ role↔permission và backfill role_id.
 *
 * Ánh xạ dưới đây GIỮ ĐÚNG hành vi phân quyền hiện có của các route
 * (suy ra từ các lời gọi authorize(...) trong src/routes).
 *
 * Idempotent: chạy lại nhiều lần vẫn an toàn.
 */
const prisma = require('./src/config/prisma');

// Danh mục permission: name => [resource, action]
const PERMISSIONS = {
  'patient:create':      ['patient', 'create'],
  'patient:read':        ['patient', 'read'],
  'patient:update':      ['patient', 'update'],
  'patient:delete':      ['patient', 'delete'],
  'patient:read_own':    ['patient', 'read_own'],
  'patient:update_own':  ['patient', 'update_own'],
  'record:create':       ['record', 'create'],
  'record:list':         ['record', 'list'],
  'record:read':         ['record', 'read'],
  'record:update':       ['record', 'update'],
  'record:delete':       ['record', 'delete'],
  'prescription:create': ['prescription', 'create'],
  'prescription:read':   ['prescription', 'read'],
  'prescription:update': ['prescription', 'update'],
  'vital:create':        ['vital', 'create'],
  'vital:read':          ['vital', 'read'],
  'vital:update':        ['vital', 'update'],
  'vital:delete':        ['vital', 'delete'],
  'user:manage':         ['user', 'manage'],
  'auditlog:read':       ['auditlog', 'read'],
  'breakglass:request':  ['breakglass', 'request'],
  'breakglass:manage':   ['breakglass', 'manage'],
  'appointment:create':     ['appointment', 'create'],
  'appointment:read':       ['appointment', 'read'],
  'appointment:read_own':   ['appointment', 'read_own'],
  'appointment:update':     ['appointment', 'update'],
  'appointment:update_own': ['appointment', 'update_own'],
  'appointment:delete':     ['appointment', 'delete'],
  'role:manage':            ['role', 'manage'],
};

// Vai trò => mô tả
const ROLES = {
  ADMIN:        'Quản trị viên hệ thống',
  DOCTOR:       'Bác sĩ điều trị',
  NURSE:        'Điều dưỡng',
  RECEPTIONIST: 'Lễ tân',
  PATIENT:      'Bệnh nhân',
};

// Vai trò => danh sách permission được cấp
const ROLE_PERMISSIONS = {
  ADMIN: [
    'patient:create', 'patient:read', 'patient:update', 'patient:delete',
    'record:list', 'record:read', 'record:delete',
    'prescription:create', 'prescription:read', 'prescription:update',
    'vital:read', 'vital:update', 'vital:delete',
    'user:manage', 'auditlog:read', 'breakglass:manage',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
    'role:manage',
  ],
  DOCTOR: [
    'patient:read',
    'record:create', 'record:list', 'record:read', 'record:update',
    'prescription:create', 'prescription:read', 'prescription:update',
    'vital:create', 'vital:read', 'vital:update', 'breakglass:request','breakglass:manage',
    'appointment:read', 'appointment:update',
  ],
  NURSE: [
    'patient:read',
    'record:list', 'record:read',
    'prescription:read',
    'vital:create', 'vital:read', 'breakglass:request',
    'appointment:read',
  ],
  RECEPTIONIST: [
    'patient:create', 'patient:read', 'patient:update',
    'appointment:create', 'appointment:read', 'appointment:update',
  ],
  PATIENT: [
    'patient:read_own', 'patient:update_own',
    'record:list', 'record:read', 'prescription:read', 'vital:read',
    'appointment:create', 'appointment:read_own', 'appointment:update_own',
  ],
};

async function seed() {
  console.log('--- SEED RBAC ---');

  // 1. Permissions
  for (const [name, [resource, action]] of Object.entries(PERMISSIONS)) {
    await prisma.permissions.upsert({
      where: { name },
      update: { resource, action },
      create: { name, resource, action },
    });
  }
  console.log(`✅ ${Object.keys(PERMISSIONS).length} permissions`);

  // 2. Roles
  for (const [name, description] of Object.entries(ROLES)) {
    await prisma.roles.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
  }
  console.log(`✅ ${Object.keys(ROLES).length} roles`);

  // 3. Ánh xạ role → permission (xóa cũ rồi tạo lại cho khớp tuyệt đối)
  const allRoles = await prisma.roles.findMany();
  const allPerms = await prisma.permissions.findMany();
  const roleId = Object.fromEntries(allRoles.map((r) => [r.name, r.id]));
  const permId = Object.fromEntries(allPerms.map((p) => [p.name, p.id]));

  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    await prisma.role_permissions.deleteMany({ where: { role_id: roleId[roleName] } });
    await prisma.role_permissions.createMany({
      data: perms.map((p) => ({ role_id: roleId[roleName], permission_id: permId[p] })),
      skipDuplicates: true,
    });
  }
  console.log('✅ Đã gán permission cho từng role');

  // 4. Backfill role_id cho user hiện có - đã bỏ qua vì không còn dùng cột role chuỗi.

  console.log('--- SEED RBAC HOÀN TẤT ---');
}

seed()
  .catch((e) => { console.error('❌', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
