/**
 * 기존 matings 레코드에 season을 백필하는 스크립트
 * 동일 pairId 내에서 matingDate 오름차순(오래된 것부터)으로 1, 2, 3... 순번을 부여
 *
 * 실행 방법:
 *   cd apps/server && npx ts-node scripts/backfill-mating-season.ts
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

interface MatingRow {
  id: number;
  pair_id: number;
  mating_date: string | null;
  season: number | null;
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
    // season이 NULL인 메이팅 조회 (pairId, matingDate 오름차순 정렬)
    const matings = (await queryRunner.query(
      `SELECT id, pair_id, mating_date, season
       FROM matings
       WHERE season IS NULL
       ORDER BY pair_id ASC, mating_date ASC, id ASC`,
    )) as MatingRow[];

    console.log(`season이 없는 메이팅: ${matings.length}건\n`);

    if (matings.length === 0) {
      console.log('백필할 데이터가 없습니다.');
      return;
    }

    // pairId별로 기존 최대 season 조회
    const maxSeasons = (await queryRunner.query(
      `SELECT pair_id, MAX(season) as max_season
       FROM matings
       WHERE season IS NOT NULL
       GROUP BY pair_id`,
    )) as { pair_id: number; max_season: number }[];

    const maxSeasonByPair = new Map<number, number>();
    for (const row of maxSeasons) {
      maxSeasonByPair.set(row.pair_id, row.max_season);
    }

    // pairId별로 그룹화
    const byPair = new Map<number, MatingRow[]>();
    for (const mating of matings) {
      const group = byPair.get(mating.pair_id) ?? [];
      group.push(mating);
      byPair.set(mating.pair_id, group);
    }

    let updated = 0;

    for (const [pairId, pairMatings] of byPair) {
      // 기존 최대 season 이후부터 시작
      let nextSeason = (maxSeasonByPair.get(pairId) ?? 0) + 1;

      for (const mating of pairMatings) {
        await queryRunner.query(
          `UPDATE matings SET season = ? WHERE id = ?`,
          [nextSeason, mating.id],
        );

        console.log(
          `  [OK] id=${mating.id} pairId=${pairId} date=${mating.mating_date} → season=${nextSeason}`,
        );

        nextSeason++;
        updated++;
      }
    }

    console.log('\n========== Summary ==========');
    console.log(`업데이트: ${updated}건 (${byPair.size}개 페어)`);
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
