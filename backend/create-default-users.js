const bcrypt = require('bcryptjs');
const prisma = require('./src/config/prisma');

const SALT_ROUNDS = 10;

async function seed() {
  console.log('--- KHỞI TẠO TÀI KHOẢN MẪU ---');

  // Mật khẩu chung cho các tài khoản mẫu
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 1. Tạo hoặc cập nhật tài khoản ADMIN
  const adminEmail = 'admin@example.com';
  let adminUser = await prisma.users.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.users.create({
      data: {
        username: 'admin_test',
        email: adminEmail,
        password_hash: passwordHash,
        full_name: 'Quản trị viên hệ thống',
        role_ref: { connect: { name: 'ADMIN' } },
        status: 'ACTIVE',
        mfa_enabled: false, // Tắt MFA để dễ đăng nhập lúc test
      },
    });
    console.log(`✅ Đã tạo tài khoản ADMIN: ${adminEmail} (mật khẩu: ${password})`);
  } else {
    console.log(`ℹ️ Tài khoản ADMIN ${adminEmail} đã tồn tại. ID: ${adminUser.id}`);
  }

  // 2. Tạo hoặc cập nhật tài khoản BÁC SĨ (DOCTOR)
  const doctorEmail = 'doctor@example.com';
  let doctorUser = await prisma.users.findUnique({ where: { email: doctorEmail } });
  if (!doctorUser) {
    doctorUser = await prisma.users.create({
      data: {
        username: 'doctor_test',
        email: doctorEmail,
        password_hash: passwordHash,
        full_name: 'BS. Nguyễn Văn Trị',
        role_ref: { connect: { name: 'DOCTOR' } },
        status: 'ACTIVE',
        mfa_enabled: false, // Tắt MFA để dễ đăng nhập lúc test
      },
    });
    console.log(`✅ Đã tạo tài khoản BÁC SĨ (DOCTOR): ${doctorEmail} (mật khẩu: ${password})`);
  } else {
    console.log(`ℹ️ Tài khoản BÁC SĨ ${doctorEmail} đã tồn tại. ID: ${doctorUser.id}`);
  }

  // 3. Tạo hoặc cập nhật tài khoản ĐIỀU DƯỠNG (NURSE)
  const nurseEmail = 'nurse@example.com';
  let nurseUser = await prisma.users.findUnique({ where: { email: nurseEmail } });
  if (!nurseUser) {
    nurseUser = await prisma.users.create({
      data: {
        username: 'nurse_test',
        email: nurseEmail,
        password_hash: passwordHash,
        full_name: 'Điều Dưỡng Trần Thị Lan',
        role_ref: { connect: { name: 'NURSE' } },
        status: 'ACTIVE',
        mfa_enabled: false,
      },
    });
    console.log(`✅ Đã tạo tài khoản ĐIỀU DƯỠNG (NURSE): ${nurseEmail} (mật khẩu: ${password})`);
  } else {
    console.log(`ℹ️ Tài khoản ĐIỀU DƯỠNG ${nurseEmail} đã tồn tại. ID: ${nurseUser.id}`);
  }

  // 4. Tạo hoặc cập nhật tài khoản LỄ TÂN (RECEPTIONIST)
  const receptionistEmail = 'receptionist@example.com';
  let receptionistUser = await prisma.users.findUnique({ where: { email: receptionistEmail } });
  if (!receptionistUser) {
    receptionistUser = await prisma.users.create({
      data: {
        username: 'receptionist_test',
        email: receptionistEmail,
        password_hash: passwordHash,
        full_name: 'Lễ Tân Phạm Thị Mai',
        role_ref: { connect: { name: 'RECEPTIONIST' } },
        status: 'ACTIVE',
        mfa_enabled: false,
      },
    });
    console.log(`✅ Đã tạo tài khoản LỄ TÂN (RECEPTIONIST): ${receptionistEmail} (mật khẩu: ${password})`);
  } else {
    console.log(`ℹ️ Tài khoản LỄ TÂN ${receptionistEmail} đã tồn tại. ID: ${receptionistUser.id}`);
  }

  // 5. Tạo hoặc cập nhật tài khoản BỆNH NHÂN (PATIENT) và hồ sơ PATIENTS tương ứng
  const patientEmail = 'patient@example.com';
  let patientUser = await prisma.users.findUnique({ where: { email: patientEmail } });
  if (!patientUser) {
    patientUser = await prisma.users.create({
      data: {
        username: 'patient_test',
        email: patientEmail,
        password_hash: passwordHash,
        full_name: 'Nguyễn Văn Bệnh Nhân',
        role_ref: { connect: { name: 'PATIENT' } },
        status: 'ACTIVE',
        mfa_enabled: false, // Tắt MFA để dễ đăng nhập lúc test
      }, // thê là oke
    });
    console.log(`✅ Đã tạo tài khoản USER BỆNH NHÂN: ${patientEmail} (mật khẩu: ${password})`);
  }

  // Tạo hồ sơ bệnh nhân hành chính liên kết với tài khoản bệnh nhân trên
  let patientProfile = await prisma.patients.findFirst({
    where: {
      OR: [
        { email: patientEmail },
        { user_id: patientUser.id },
        { patient_code: 'EMR-2026-0001' }
      ]
    }
  });

  if (!patientProfile) {
    patientProfile = await prisma.patients.create({
      data: {
        patient_code: 'EMR-2026-0001',
        full_name: 'Nguyễn Văn Bệnh Nhân',
        dob: new Date('1990-01-01'),
        gender: 'MALE',
        phone: '0987654321',
        email: patientEmail,
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
        citizen_id: '012345678901',
        user_id: patientUser.id,
      },
    });
    console.log(`✅ Đã tạo hồ sơ bệnh nhân (PATIENT PROFILE) liên kết. ID: ${patientProfile.id}, Mã bệnh nhân: ${patientProfile.patient_code}`);
  } else {
    // Nếu hồ sơ đã có, cập nhật user_id và email nếu chưa khớp
    if (patientProfile.user_id !== patientUser.id || patientProfile.email !== patientEmail) {
      patientProfile = await prisma.patients.update({
        where: { id: patientProfile.id },
        data: {
          user_id: patientUser.id,
          email: patientEmail
        },
      });
      console.log(`✅ Đã cập nhật liên kết user_id và email cho hồ sơ bệnh nhân ID: ${patientProfile.id}`);
    } else {
      console.log(`ℹ️ Hồ sơ bệnh nhân ${patientEmail} đã tồn tại. ID: ${patientProfile.id}, Mã bệnh nhân: ${patientProfile.patient_code}`);
    }
  }

  console.log('--- KHỞI TẠO HOÀN TẤT ---');
  console.log('Bạn có thể sử dụng thông tin sau để kiểm thử:');
  console.log(`- Tài khoản Bác sĩ: doctor@example.com / Password123!`);
  console.log(`- Tài khoản Bệnh nhân: patient@example.com / Password123!`);
  console.log(`- ID Bệnh nhân để tạo bệnh án: ${patientProfile.id.toString()}`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

// note some accounts thôi