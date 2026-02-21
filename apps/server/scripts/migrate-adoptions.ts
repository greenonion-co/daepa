/**
 * adoptions 테이블 데이터를 pet_adoptions + adoption_histories로 마이그레이션하는 스크립트
 *
 * 마이그레이션 로직:
 *   1. adoptions에서 status=SOLD인 row → adoption_histories에 INSERT
 *   2. adoptions에서 is_active=true AND is_deleted=false인 row → pet_adoptions에 INSERT
 *      - status=SOLD인 경우 NONE으로 리셋
 *   3. is_active=false AND status!=SOLD인 비활성 row는 무시 (이미 최신 active row로 대체됨)
 *
 * 실행 방법:
 *   cd apps/server && npx ts-node scripts/migrate-adoptions.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

// ==================== .env 로드 ====================

const envPath = path.resolve(__dirname, '../.env.local');
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

// ==================== 타입 정의 ====================

interface OldAdoptionRow {
  id: number;
  adoption_id: string;
  pet_id: string;
  price: number | null;
  adoption_date: string | null;
  seller_id: string;
  buyer_id: string | null;
  memo: string | null;
  method: string | null;
  is_active: number; // tinyint
  is_deleted: number; // tinyint
  status: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== 메인 함수 ====================

async function main() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  await dataSource.initialize();
  console.log('Database connected\n');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // 기존 adoptions 테이블 존재 확인
    const tables = (await queryRunner.query(
      `SHOW TABLES LIKE 'adoptions'`,
    )) as unknown[];
    if (tables.length === 0) {
      console.log('adoptions 테이블이 존재하지 않습니다.');
      return;
    }

    // 전체 데이터 조회
    const allRows = (await queryRunner.query(
      `SELECT * FROM adoptions ORDER BY id ASC`,
    )) as OldAdoptionRow[];

    console.log(`기존 adoptions 레코드 수: ${allRows.length}\n`);

    if (allRows.length === 0) {
      console.log('마이그레이션할 데이터가 없습니다.');
      return;
    }

    // 분류
    const soldRows = allRows.filter((r) => r.status === 'SOLD');
    const activeRows = allRows.filter(
      (r) => r.is_active === 1 && r.is_deleted === 0,
    );
    const deletedRows = allRows.filter((r) => r.is_deleted === 1);
    const inactiveNonSoldRows = allRows.filter(
      (r) => r.is_active === 0 && r.is_deleted === 0 && r.status !== 'SOLD',
    );

    console.log(`판매완료 (→ adoption_histories): ${soldRows.length}개`);
    console.log(`활성 (→ pet_adoptions): ${activeRows.length}개`);
    console.log(`삭제됨 (무시): ${deletedRows.length}개`);
    console.log(
      `비활성+미판매 (무시, 이미 active row로 대체): ${inactiveNonSoldRows.length}개`,
    );
    console.log('');

    await queryRunner.startTransaction();

    try {
      // 1. 판매완료 → adoption_histories
      let historyCount = 0;
      for (const row of soldRows) {
        // 중복 체크 (같은 pet_id, seller_id, adoption_date)
        // adoption_date가 NULL이면 중복 체크 불가 (MySQL에서 NULL != NULL)이므로 별도 처리
        if (row.adoption_date) {
          const existing = (await queryRunner.query(
            `SELECT id FROM adoption_histories
             WHERE pet_id = ? AND seller_id = ? AND adoption_date = ?
             LIMIT 1`,
            [row.pet_id, row.seller_id, row.adoption_date],
          )) as { id: number }[];

          if (existing.length > 0) {
            console.log(
              `  [SKIP history] adoption_id=${row.adoption_id} - 이미 존재`,
            );
            continue;
          }
        }

        await queryRunner.query(
          `INSERT INTO adoption_histories
            (pet_id, seller_id, adoption_date, buyer_id, price, method, memo)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            row.pet_id,
            row.seller_id,
            row.adoption_date,
            row.buyer_id,
            row.price,
            row.method,
            row.memo,
          ],
        );
        historyCount++;
      }
      console.log(`adoption_histories INSERT: ${historyCount}개\n`);

      // 2. 활성 row → pet_adoptions
      // pet_id당 1개만 (UNIQUE 제약). 동일 pet_id에 여러 active row가 있을 수 있으므로 최신만 사용.
      const petAdoptionMap = new Map<string, OldAdoptionRow>();
      for (const row of activeRows) {
        const existing = petAdoptionMap.get(row.pet_id);
        if (!existing || row.id > existing.id) {
          petAdoptionMap.set(row.pet_id, row);
        }
      }

      let adoptionCount = 0;
      for (const [petId, row] of petAdoptionMap) {
        // 중복 체크
        const existing = (await queryRunner.query(
          `SELECT id FROM pet_adoptions WHERE pet_id = ? LIMIT 1`,
          [petId],
        )) as { id: number }[];

        if (existing.length > 0) {
          console.log(`  [SKIP pet_adoption] pet_id=${petId} - 이미 존재`);
          continue;
        }

        // SOLD 상태의 active row는 NONE으로 리셋 (이미 history에 기록됨)
        const status = row.status === 'SOLD' ? 'NONE' : row.status;
        const price = row.status === 'SOLD' ? null : row.price;
        const memo = row.status === 'SOLD' ? null : row.memo;
        const reservedUserId = row.status === 'SOLD' ? null : row.buyer_id;

        await queryRunner.query(
          `INSERT INTO pet_adoptions
            (pet_id, status, price, memo, reserved_user_id)
           VALUES (?, ?, ?, ?, ?)`,
          [petId, status, price, memo, reservedUserId],
        );
        adoptionCount++;
      }
      console.log(`pet_adoptions INSERT: ${adoptionCount}개\n`);

      // 3. pet_adoptions에 없는 펫 확인 (adoptions에 row가 없었던 펫)
      const missingPets = (await queryRunner.query(
        `SELECT p.pet_id, p.owner_id
         FROM pets p
         LEFT JOIN pet_adoptions pa ON pa.pet_id = p.pet_id
         WHERE pa.id IS NULL AND p.is_deleted = false AND p.owner_id IS NOT NULL`,
      )) as { pet_id: string; owner_id: string }[];

      if (missingPets.length > 0) {
        console.log(`pet_adoptions 누락 펫 보충: ${missingPets.length}개`);
        for (const pet of missingPets) {
          await queryRunner.query(
            `INSERT INTO pet_adoptions (pet_id, status)
             VALUES (?, 'NONE')`,
            [pet.pet_id],
          );
        }
        console.log(`보충 INSERT 완료\n`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }

    // 결과 확인
    const [historyTotal] = (await queryRunner.query(
      `SELECT COUNT(*) as cnt FROM adoption_histories`,
    )) as { cnt: number }[];
    const [adoptionTotal] = (await queryRunner.query(
      `SELECT COUNT(*) as cnt FROM pet_adoptions`,
    )) as { cnt: number }[];

    console.log('========== Summary ==========');
    console.log(`adoption_histories 총 레코드: ${historyTotal.cnt}`);
    console.log(`pet_adoptions 총 레코드: ${adoptionTotal.cnt}`);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }

  console.log('\n=== Done ===');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
