/**
 * 기존 adoption_histories 레코드에 petSnapshot을 백필하는 스크립트
 * 현재 pet/pet_detail/parent_request 데이터를 기반으로 스냅샷을 생성하여 저장
 *
 * 실행 방법:
 *   cd apps/server && npx ts-node scripts/backfill-pet-snapshot.ts
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

interface HistoryRow {
  id: number;
  pet_id: string;
}

interface PetRow {
  pet_id: string;
  type: string;
  name: string | null;
  species: string;
  hatching_date: string | null;
  is_deleted: number;
}

interface PetDetailRow {
  sex: string | null;
  growth: string | null;
  morphs: string[] | null;
  traits: string[] | null;
}

interface ParentRow {
  parent_pet_id: string;
  parent_name: string | null;
  sex: string | null;
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
    // petSnapshot이 NULL인 레코드 조회
    const histories = (await queryRunner.query(
      `SELECT id, pet_id FROM adoption_histories WHERE pet_snapshot IS NULL ORDER BY id ASC`,
    )) as HistoryRow[];

    console.log(`petSnapshot이 없는 레코드: ${histories.length}건\n`);

    if (histories.length === 0) {
      console.log('백필할 데이터가 없습니다.');
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const history of histories) {
      // 펫 정보 조회
      const [pet] = (await queryRunner.query(
        `SELECT pet_id, type, name, species, hatching_date, is_deleted
         FROM pets WHERE pet_id = ? LIMIT 1`,
        [history.pet_id],
      )) as PetRow[];

      if (!pet) {
        console.log(`  [SKIP] id=${history.id} petId=${history.pet_id} - 펫 정보 없음`);
        skipped++;
        continue;
      }

      // 펫 상세 정보 조회
      const [petDetail] = (await queryRunner.query(
        `SELECT sex, growth, morphs, traits
         FROM pet_details WHERE pet_id = ? LIMIT 1`,
        [history.pet_id],
      )) as PetDetailRow[];

      // 승인된 부모 정보 조회
      const parents = (await queryRunner.query(
        `SELECT pr.parent_pet_id, p.name AS parent_name, pd.sex
         FROM parent_requests pr
         LEFT JOIN pets p ON p.pet_id = pr.parent_pet_id
         LEFT JOIN pet_details pd ON pd.pet_id = pr.parent_pet_id
         WHERE pr.child_pet_id = ? AND pr.status = 'approved'`,
        [history.pet_id],
      )) as ParentRow[];

      let father: { petId: string; name?: string } | null = null;
      let mother: { petId: string; name?: string } | null = null;

      for (const parent of parents) {
        const parentData = {
          petId: parent.parent_pet_id,
          name: parent.parent_name ?? undefined,
        };
        if (parent.sex === 'M') father = parentData;
        else if (parent.sex === 'F') mother = parentData;
      }

      // 삭제된 펫의 이름에서 DELETED_ 접두사 제거
      const isDeleted = !!pet.is_deleted;
      let petName = pet.name;
      if (isDeleted && petName) {
        const match = petName.match(/^DELETED_[^_]+_(.+)$/);
        if (match) petName = match[1];
      }

      const morphs = petDetail?.morphs ?? undefined;
      const traits = petDetail?.traits ?? undefined;

      const petSnapshot = {
        petId: pet.pet_id,
        type: pet.type,
        name: petName ?? undefined,
        species: pet.species,
        sex: petDetail?.sex ?? undefined,
        growth: petDetail?.growth ?? undefined,
        morphs: morphs && morphs.length > 0 ? morphs : undefined,
        traits: traits && traits.length > 0 ? traits : undefined,
        hatchingDate: pet.hatching_date ?? undefined,
        isDeleted: isDeleted || undefined,
        father,
        mother,
      };

      // undefined 값 제거
      const cleanSnapshot = JSON.parse(JSON.stringify(petSnapshot));

      await queryRunner.query(
        `UPDATE adoption_histories SET pet_snapshot = ? WHERE id = ?`,
        [JSON.stringify(cleanSnapshot), history.id],
      );

      updated++;
      console.log(
        `  [OK] id=${history.id} petId=${history.pet_id} (${updated}/${histories.length})`,
      );
    }

    // 결과 확인
    const [total] = (await queryRunner.query(
      `SELECT COUNT(*) as cnt FROM adoption_histories`,
    )) as { cnt: number }[];
    const [filled] = (await queryRunner.query(
      `SELECT COUNT(*) as cnt FROM adoption_histories WHERE pet_snapshot IS NOT NULL`,
    )) as { cnt: number }[];

    console.log('\n========== Summary ==========');
    console.log(`업데이트: ${updated}건, 스킵: ${skipped}건`);
    console.log(`adoption_histories 총: ${total.cnt}건, petSnapshot 있음: ${filled.cnt}건`);
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
