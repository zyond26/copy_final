const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getCurrentTime } = require('../utils/time');
const prisma = require('../config/prisma');
const OtpService = require('./otp.service');
const EmailService = require('./email.service');
const { generatePatientCode } = require('../utils/patientCode');
const {
  isPasswordExpired,
  getPasswordExpiresAt,
  getDaysUntilExpiry,
  PASSWORD_MAX_AGE_DAYS,
} = require('../utils/passwordPolicy');

const SALT_ROUNDS = 10;

// Chống Brute Force: khóa tài khoản tạm thời sau nhiều lần đăng nhập sai (ISO 27799 §9.4.2)
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS, 10) || 5;
const LOCK_MINUTES = parseInt(process.env.ACCOUNT_LOCK_MINUTES, 10) || 15;

/**
 * Auth Service – business logic cho xác thực và quản lý phiên.
 */
const AuthService = {
  // ─── ND-01: Đăng ký tài khoản (Bệnh nhân) ─────────────────

  /**
   * Bệnh nhân tự đăng ký tài khoản.
   * Tạo user với status PENDING, gửi OTP xác thực email.
   */
  async register({ email, password, full_name, username, citizen_id, dob, gender, phone, address }) {
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

    // Kiểm tra citizen_id đã tồn tại
    const trimmedCitizenId = citizen_id.trim();
    const existingCitizenId = await prisma.users.findUnique({ where: { citizen_id: trimmedCitizenId } });
    if (existingCitizenId) {
      const err = new Error('CCCD/CMND đã được sử dụng bởi tài khoản khác.');
      err.statusCode = 409;
      throw err;
    }
    
    const existingPatient = await prisma.patients.findUnique({ where: { citizen_id: trimmedCitizenId } });
    if (existingPatient && existingPatient.user_id !== null) {
      const err = new Error('Hồ sơ bệnh nhân này đã được liên kết với một tài khoản khác.');
      err.statusCode = 409;
      throw err;
    }

    // Hash mật khẩu
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Tạo user với role PATIENT, status PENDING
    const user = await prisma.users.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        full_name: full_name.trim(),
        citizen_id: trimmedCitizenId,
        role_ref: { connect: { name: 'PATIENT' } }, // vai trò qua role_id (chuẩn hóa)
        status: 'PENDING',
        mfa_enabled: true,
        password_changed_at: getCurrentTime(),
      },
    });

    // ─── START LINKING LOGIC ───
    let linked = false;

    if (existingPatient) {
      await prisma.patients.update({
        where: { id: existingPatient.id },
        data: {
          user_id: user.id,
          dob: dob ? new Date(dob) : existingPatient.dob,
          gender: gender || existingPatient.gender,
          phone: phone || existingPatient.phone,
          address: address || existingPatient.address,
        }
      });
      linked = true;
    }

    if (!linked) {
      const patientCode = await generatePatientCode(prisma);
      await prisma.patients.create({
        data: {
          patient_code: patientCode,
          full_name: full_name.trim(),
          email: email.trim().toLowerCase(),
          citizen_id: trimmedCitizenId,
          user_id: user.id,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          phone: phone || null,
          address: address || null,
        }
      });
    }
    // ─── END LINKING LOGIC ───
    
    // Sinh OTP và gửi email xác thực
    const otpCode = await OtpService.generateAndSave(user.id);
    EmailService.sendVerificationOtp(user.email, otpCode).catch(err => console.error('Send verification email error:', err));

    return {
      id: user.id.toString(),
      email: user.email,
      full_name: user.full_name,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    };
  },

  /**
   * Xác thực email bằng OTP.
   * Chuyển status từ PENDING sang ACTIVE.
   */
  async verifyEmail({ email, otp_code }) {
    const user = await prisma.users.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      const err = new Error('Email không tồn tại trong hệ thống.');
      err.statusCode = 404;
      throw err;
    }

    if (user.status === 'ACTIVE') {
      const err = new Error('Tài khoản đã được xác thực trước đó.');
      err.statusCode = 400;
      throw err;
    }

    const isValid = await OtpService.verify(user.id, otp_code);
    if (!isValid) {
      const err = new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
      err.statusCode = 400;
      throw err;
    }

    // Kích hoạt tài khoản
    await prisma.users.update({
      where: { id: user.id },
      data: { status: 'ACTIVE', updated_at: getCurrentTime() },
    });

    return { message: 'Xác thực email thành công. Bạn có thể đăng nhập.' };
  },

  // ─── ND-02: Đăng nhập + MFA ────────────────────────────────

  /**
   * Bước 1: Đăng nhập bằng email + mật khẩu.
   * Nếu MFA bật → gửi OTP qua email, trả temporary_token.
   * Nếu MFA tắt → trả access_token luôn.
   */
  async login({ email, password }) {
    const user = await prisma.users.findUnique({ where: { email: email.trim().toLowerCase() }, include: { role_ref: true } });
    if (!user) {
      const err = new Error('Email hoặc mật khẩu không đúng.');
      err.statusCode = 401;
      throw err;
    }

    // Kiểm tra tài khoản đã kích hoạt chưa
    if (user.status === 'PENDING') {
      const err = new Error('Tài khoản chưa được xác thực email. Vui lòng kiểm tra email.');
      err.statusCode = 403;
      throw err;
    }

    if (user.status === 'LOCKED') {
      const err = new Error('Tài khoản đã bị khóa. Vui lòng liên hệ Admin.');
      err.statusCode = 403;
      throw err;
    }

    // Tài khoản đang bị khóa tạm thời do đăng nhập sai nhiều lần?
    if (user.locked_until && user.locked_until > getCurrentTime()) {
      const secondsLeft = Math.ceil((user.locked_until.getTime() - getCurrentTime().getTime()) / 1000);
      const minutesLeft = Math.ceil(secondsLeft / 60);
      const err = new Error(`Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`);
      err.statusCode = 403;
      err.secondsLeft = secondsLeft;
      throw err;
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Tăng bộ đếm sai; đạt ngưỡng thì khóa tạm thời và reset bộ đếm
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockDurationSeconds = LOCK_MINUTES * 60;
        await prisma.users.update({
          where: { id: user.id },
          data: { failed_login_attempts: 0, locked_until: new Date(getCurrentTime().getTime() + lockDurationSeconds * 1000) },
        });
        const err = new Error(`Đăng nhập sai quá ${MAX_FAILED_ATTEMPTS} lần. Tài khoản bị tạm khóa ${LOCK_MINUTES} phút.`);
        err.statusCode = 403;
        err.secondsLeft = lockDurationSeconds;
        throw err;
      }
      await prisma.users.update({
        where: { id: user.id },
        data: { failed_login_attempts: attempts },
      });
      const err = new Error(`Email hoặc mật khẩu không đúng. Còn ${MAX_FAILED_ATTEMPTS - attempts} lần thử.`);
      err.statusCode = 401;
      throw err;
    }

    // Đăng nhập đúng → xóa bộ đếm sai và khóa tạm (nếu có)
    if (user.failed_login_attempts || user.locked_until) {
      await prisma.users.update({
        where: { id: user.id },
        data: { failed_login_attempts: 0, locked_until: null },
      });
    }

    // Nếu MFA bật → sinh OTP, gửi email, trả temporary token
    if (user.mfa_enabled) {
      const otpCode = await OtpService.generateAndSave(user.id);
      EmailService.sendLoginOtp(user.email, otpCode).catch(err => console.error('Send login MFA email error:', err));

      // Tạo temporary token (chỉ dùng cho bước verify MFA, hết hạn nhanh)
      const temporaryToken = jwt.sign(
        { id: user.id.toString(), email: user.email, purpose: 'mfa' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' },
      );

      return {
        requires_mfa: true,
        temporary_token: temporaryToken,
        message: 'Vui lòng xác thực mã OTP đã gửi đến email.',
      };
    }

    // MFA tắt → trả token luôn
    return AuthService._generateTokens(user);
  },

  /**
   * Bước 2: Xác thực MFA bằng OTP.
   * Yêu cầu temporary_token từ bước login.
   */
  async verifyMfa({ userId, otp_code }) {
    const user = await prisma.users.findUnique({ where: { id: BigInt(userId) }, include: { role_ref: true } });
    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    const isValid = await OtpService.verify(user.id, otp_code);
    if (!isValid) {
      const err = new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
      err.statusCode = 400;
      throw err;
    }

    // Cập nhật last_login
    await prisma.users.update({
      where: { id: user.id },
      data: { updated_at: getCurrentTime() },
    });

    return AuthService._generateTokens(user);
  },

  // ─── ND-04: Đổi mật khẩu ───────────────────────────────────

  /**
   * Người dùng tự đổi mật khẩu.
   * Yêu cầu nhập mật khẩu hiện tại để xác nhận.
   */
  async changePassword({ userId, current_password, new_password }) {
    const user = await prisma.users.findUnique({ where: { id: BigInt(userId) } });
    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isPasswordValid) {
      const err = new Error('Mật khẩu hiện tại không đúng.');
      err.statusCode = 400;
      throw err;
    }

    // Hash mật khẩu mới
    const isSameAsOld = await bcrypt.compare(new_password, user.password_hash);
    if (isSameAsOld) {
      const err = new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
      err.statusCode = 400;
      throw err;
    }

    const newPasswordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash, password_changed_at: getCurrentTime(), updated_at: getCurrentTime() },
    });

    return { message: 'Đổi mật khẩu thành công.', must_change_password: false };
  },

  // ─── ND-05: Quên mật khẩu ──────────────────────────────────

  /**
   * Gửi OTP khôi phục mật khẩu qua email.
   */
  async forgotPassword({ email }) {
    const user = await prisma.users.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      // Trả thông báo chung (không tiết lộ email có tồn tại hay không – bảo mật)
      return { message: 'Nếu email tồn tại, mã OTP khôi phục mật khẩu đã được gửi.' };
    }

    const otpCode = await OtpService.generateAndSave(user.id);
    EmailService.sendPasswordResetOtp(user.email, otpCode).catch(err => console.error('Send reset password email error:', err));

    return { message: 'Nếu email tồn tại, mã OTP khôi phục mật khẩu đã được gửi.' };
  },

  /**
   * Đặt lại mật khẩu bằng OTP.
   */
  async resetPassword({ email, otp_code, new_password }) {
    const user = await prisma.users.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      const err = new Error('Email không tồn tại trong hệ thống.');
      err.statusCode = 404;
      throw err;
    }

    const isValid = await OtpService.verify(user.id, otp_code);
    if (!isValid) {
      const err = new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
      err.statusCode = 400;
      throw err;
    }

    // Không cho phép đặt lại trùng mật khẩu cũ
    const isSameAsOld = await bcrypt.compare(new_password, user.password_hash);
    if (isSameAsOld) {
      const err = new Error('Mật khẩu mới phải khác mật khẩu cũ.');
      err.statusCode = 400;
      throw err;
    }

    const newPasswordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash, password_changed_at: getCurrentTime(), updated_at: getCurrentTime() },
    });

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.' };
  },

  // ─── MFA Setup / Disable ───────────────────────────────────

  /**
   * Bật MFA cho user.
   */
  async setupMfa({ userId }) {
    const user = await prisma.users.findUnique({ where: { id: BigInt(userId) } });
    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    if (user.mfa_enabled) {
      const err = new Error('MFA đã được bật cho tài khoản này.');
      err.statusCode = 400;
      throw err;
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { mfa_enabled: true, updated_at: getCurrentTime() },
    });

    return { message: 'Đã bật xác thực đa yếu tố (MFA).' };
  },

  /**
   * Tắt MFA cho user.
   */
  async disableMfa({ userId }) {
    const user = await prisma.users.findUnique({ where: { id: BigInt(userId) } });
    if (!user) {
      const err = new Error('Người dùng không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    if (!user.mfa_enabled) {
      const err = new Error('MFA chưa được bật cho tài khoản này.');
      err.statusCode = 400;
      throw err;
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { mfa_enabled: false, updated_at: getCurrentTime() },
    });

    return { message: 'Đã tắt xác thực đa yếu tố (MFA).' };
  },

  // ─── Logout ─────────────────────────────────────────────────

  /**
   * Đăng xuất. Với JWT stateless, client tự xóa token.
   * Endpoint này chỉ để ghi audit log.
   */
  async logout() {
    return { message: 'Đăng xuất thành công.' };
  },

  // ─── Private Helpers ────────────────────────────────────────

  /**
   * Tạo access_token và refresh_token cho user.
   * @private
   */
  _generateTokens(user) {
    const expired = isPasswordExpired(user);
    const passwordExpiresAt = getPasswordExpiresAt(user);

    const payload = {
      id: user.id.toString(),
      email: user.email,
      role: user.role_ref?.name,
      full_name: user.full_name,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    const refreshToken = jwt.sign(
      { id: user.id.toString(), type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      must_change_password: expired,
      password_expires_at: passwordExpiresAt.toISOString(),
      password_max_age_days: PASSWORD_MAX_AGE_DAYS,
      days_until_password_expiry: getDaysUntilExpiry(user),
      user: {
        id: user.id.toString(),
        email: user.email,
        full_name: user.full_name,
        role: user.role_ref?.name,
        must_change_password: expired,
        password_expires_at: passwordExpiresAt.toISOString(),
      },
    };
  },
};

module.exports = AuthService;
