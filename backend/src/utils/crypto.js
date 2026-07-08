const crypto = require('node:crypto');

const keyHex = process.env.ENCRYPTION_KEY;
const ivHex = process.env.ENCRYPTION_IV;

// Khóa 32 bytes (64 ký tự hex) và IV 16 bytes (32 ký tự hex)
const KEY = keyHex && keyHex.length === 64 ? Buffer.from(keyHex, 'hex') : crypto.randomBytes(32);
const IV = ivHex && ivHex.length === 32 ? Buffer.from(ivHex, 'hex') : crypto.randomBytes(16);
const ALGORITHM = 'aes-256-cbc';

/**
 * Mã hóa chuỗi văn bản rõ thành mã hóa hex
 * @param {string} text - Văn bản cần mã hóa
 * @returns {string|null} Chuỗi hex đã mã hóa
 */
function encrypt(text) {
  if (text === null || text === undefined) return null;
  const str = String(text);
  if (str.trim() === '') return '';

  try {
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (err) {
    console.error('[Encryption Failed]', err.message);
    return text;
  }
}

/**
 * Giải mã chuỗi mã hóa hex về dạng văn bản rõ
 * Tự động trả về văn bản gốc nếu giải mã thất bại (Tương thích ngược dữ liệu cũ)
 * @param {string} ciphertext - Chuỗi hex cần giải mã
 * @returns {string|null} Văn bản rõ đã giải mã
 */
function decrypt(ciphertext) {
  if (ciphertext === null || ciphertext === undefined) return null;
  const str = String(ciphertext);
  if (str.trim() === '') return '';

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
    let decrypted = decipher.update(str, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Dữ liệu cũ dạng văn bản rõ chưa mã hóa -> Trả về nguyên bản
    return ciphertext;
  }
}

module.exports = {
  encrypt,
  decrypt,
};
