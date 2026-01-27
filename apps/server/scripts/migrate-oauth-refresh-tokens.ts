/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
/**
 * OAuth Refresh Token 암호화 마이그레이션 스크립트
 *
 * 기존 평문으로 저장된 OAuth refresh token을 암호화합니다.
 *
 * 사용법:
 * 1. 환경변수 설정 (OAUTH_REFRESH_SECRET, DB 연결정보)
 * 2. npx ts-node scripts/migrate-oauth-refresh-tokens.ts
 *
 * 주의:
 * - 프로덕션 실행 전 반드시 백업 수행
 * - 이미 암호화된 토큰은 건너뜁니다 (decryptSafe 사용)
 */

import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { encryptIfNeeded, isEncrypted } from '../src/common/utils/crypto.util';

// .env 파일 로드
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=');
      }
    }
  });
}

async function migrate() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // 모든 OAuth 레코드 조회
    const oauthRecords = await queryRunner.query(
      'SELECT id, refresh_token FROM oauth WHERE refresh_token IS NOT NULL',
    );

    console.log(`Found ${oauthRecords.length} OAuth records with refreshToken`);

    let encryptedCount = 0;
    let skippedCount = 0;

    for (const record of oauthRecords) {
      const { id, refresh_token: refreshToken } = record;

      // 이미 암호화된 토큰인지 확인
      if (isEncrypted(refreshToken)) {
        skippedCount++;
        continue;
      }

      // 암호화
      const encryptedToken = encryptIfNeeded(refreshToken);

      // 업데이트
      await queryRunner.query(
        'UPDATE oauth SET refresh_token = ? WHERE id = ?',
        [encryptedToken, id],
      );

      encryptedCount++;
    }

    console.log(`Migration completed:`);
    console.log(`  - Encrypted: ${encryptedCount}`);
    console.log(`  - Skipped (already encrypted): ${skippedCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

migrate()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
