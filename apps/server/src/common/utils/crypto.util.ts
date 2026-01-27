import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCODING = 'base64';

function getSecretKey(): Buffer {
  const secret = process.env.OAUTH_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      'OAUTH_REFRESH_SECRET environment variable is not configured',
    );
  }

  // 32바이트(256비트) 키 생성
  return crypto.scryptSync(secret, 'salt', 32);
}

/**
 * 문자열을 AES-256-GCM으로 암호화합니다.
 * @param plainText 암호화할 평문
 * @returns 암호화된 문자열 (base64: iv + authTag + cipherText)
 */
export function encrypt(plainText: string): string {
  if (!plainText) {
    return plainText;
  }

  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag();

  // iv(16) + authTag(16) + encrypted 를 하나의 문자열로 결합
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, ENCODING),
  ]);

  return combined.toString(ENCODING);
}

/**
 * AES-256-GCM으로 암호화된 문자열을 복호화합니다.
 * @param encryptedText 암호화된 문자열 (base64)
 * @returns 복호화된 평문
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  const key = getSecretKey();
  const combined = Buffer.from(encryptedText, ENCODING);

  // iv(16) + authTag(16) + encrypted
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(
    encrypted.toString(ENCODING),
    ENCODING,
    'utf8',
  );
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * 암호화된 텍스트인지 확인합니다.
 * 기존 평문 데이터와 구분하기 위해 사용합니다.
 */
export function isEncrypted(text: string): boolean {
  if (!text) {
    return false;
  }

  try {
    const combined = Buffer.from(text, ENCODING);
    // 최소 길이 체크: iv(16) + authTag(16) + 최소 암호문(1)
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      return false;
    }

    // 실제로 복호화 시도하여 확인
    decrypt(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 암호화되지 않은 토큰이면 암호화하고, 이미 암호화되어 있으면 그대로 반환합니다.
 * 마이그레이션 시 기존 평문 데이터 처리에 사용합니다.
 */
export function encryptIfNeeded(text: string): string {
  if (!text) {
    return text;
  }

  if (isEncrypted(text)) {
    return text;
  }

  return encrypt(text);
}

/**
 * 복호화를 시도하고, 실패하면 원본을 반환합니다.
 * 마이그레이션 시 기존 평문 데이터 처리에 사용합니다.
 */
export function decryptSafe(text: string): string {
  if (!text) {
    return text;
  }

  try {
    return decrypt(text);
  } catch {
    // 복호화 실패 시 평문으로 간주하고 원본 반환
    return text;
  }
}
