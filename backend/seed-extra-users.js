/**
 * Seed thêm 2 tài khoản mẫu: NURSE và RECEPTIONIST.
 * Dùng $queryRawUnsafe để bypass audit extension.
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('./generated/prisma');
const db = new PrismaClient({ log: ['warn', 'error'] });

async function seed() {
  console.log('--- TẠO TÀI KHOẢN MẪU BỔ SUNG ---');

  const password = 'Password123!';
  const hash = await bcrypt.hash(password, 12);

  const [nurseRole] = await db.$queryRawUnsafe(`SELECT id FROM roles WHERE name = 'NURSE' LIMIT 1`);
  const [receptionistRole] = await db.$queryRawUnsafe(`SELECT id FROM roles WHERE name = 'RECEPTIONIST' LIMIT 1`);

  if (!nurseRole || !receptionistRole) {
    console.error('❌ Roles NURSE/RECEPTIONIST chưa có. Chạy: node seed-rbac.js trước.');
    process.exit(1);
  }

  // NURSE
  const [existNurse] = await db.$queryRawUnsafe(`SELECT id FROM users WHERE email = 'nurse@example.com' LIMIT 1`);
  if (!existNurse) {
    await db.$executeRawUnsafe(
      `INSERT INTO users (username, email, password_hash, full_name, role_id, status, mfa_enabled, created_at, updated_at)
       VALUES ('nurse_test', 'nurse@example.com', $1, 'Điều Dưỡng Trần Thị Lan', $2, 'ACTIVE', false, NOW(), NOW())`,
      hash, nurseRole.id
    );
    console.log(`✅ NURSE   → nurse@example.com / ${password}`);
  } else {
    console.log(`ℹ️  nurse@example.com đã tồn tại.`);
  }

  // RECEPTIONIST
  const [existRec] = await db.$queryRawUnsafe(`SELECT id FROM users WHERE email = 'receptionist@example.com' LIMIT 1`);
  if (!existRec) {
    await db.$executeRawUnsafe(
      `INSERT INTO users (username, email, password_hash, full_name, role_id, status, mfa_enabled, created_at, updated_at)
       VALUES ('receptionist_test', 'receptionist@example.com', $1, 'Lễ Tân Phạm Thị Mai', $2, 'ACTIVE', false, NOW(), NOW())`,
      hash, receptionistRole.id
    );
    console.log(`✅ RECEPTIONIST → receptionist@example.com / ${password}`);
  } else {
    console.log(`ℹ️  receptionist@example.com đã tồn tại.`);
  }

  console.log('\n✅ Tổng hợp các tài khoản demo:');
  console.log('  admin@example.com            / Password123!  → ADMIN');
  console.log('  doctor@example.com           / Password123!  → DOCTOR');
  console.log('  nurse@example.com            / Password123!  → NURSE');
  console.log('  receptionist@example.com     / Password123!  → RECEPTIONIST');
  console.log('  patient@example.com          / Password123!  → PATIENT');
}

seed()
  .catch((e) => { console.error('❌', e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
