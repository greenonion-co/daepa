/**
 * pet_images 테이블에 이미지가 없는 펫에 더미 이미지를 할당하는 스크립트
 *
 * 실행 방법:
 *   cd apps/server && npx ts-node scripts/upsert-pet-images.ts
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

// ==================== 더미 이미지 데이터 ====================

const DUMMY_IMAGE_FILES = [
  [
    {
      url: 'https://media.breedy.kr/2ERBjIX9/8LT7hSzftm',
      size: 424841,
      fileName: '2ERBjIX9/8LT7hSzftm',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/Kpz_ULX-/RPOfD15-aZ',
      size: 424841,
      fileName: 'Kpz_ULX-/RPOfD15-aZ',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/KDrh-b-R/hTVCOniGt3',
      size: 417530,
      fileName: 'KDrh-b-R/hTVCOniGt3',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/ORr1_wR7/XU9yjTDs44',
      size: 388963,
      fileName: 'ORr1_wR7/XU9yjTDs44',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/_TbPuUDd/UIRBe5B9wB',
      size: 1082188,
      fileName: '_TbPuUDd/UIRBe5B9wB',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/Yavp_3Rx/aO7zzXCqWM',
      size: 1082188,
      fileName: 'Yavp_3Rx/aO7zzXCqWM',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/7BI_NEIF/GIesuESDBu',
      size: 659352,
      fileName: '7BI_NEIF/GIesuESDBu',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/4dDQhf8j/pJvYsLoQ7w',
      size: 388963,
      fileName: '4dDQhf8j/pJvYsLoQ7w',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/_463Erzy/UVh6mgQzH1',
      size: 635503,
      fileName: '_463Erzy/UVh6mgQzH1',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/P8hf7Icz/gsFh2s1ytL',
      size: 715798,
      fileName: 'P8hf7Icz/gsFh2s1ytL',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/Rc3mdDey/CNe5ZCa4sV',
      size: 453468,
      fileName: 'Rc3mdDey/CNe5ZCa4sV',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/KdQM8Mmt/nzpvuehgC9',
      size: 273143,
      fileName: 'KdQM8Mmt/nzpvuehgC9',
      mimeType: 'image/jpeg',
    },
  ],
  [
    {
      url: 'https://media.breedy.kr/u774c65a/826MxZylsi',
      size: 512474,
      fileName: 'u774c65a/826MxZylsi',
      mimeType: 'image/jpeg',
    },
  ],
];

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
    // pet_images에 존재하지 않는 pet_id 조회
    const petsWithoutImages = (await queryRunner.query(
      `SELECT p.pet_id
       FROM pets p
       LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
       WHERE pi.id IS NULL`,
    )) as { pet_id: string }[];

    if (petsWithoutImages.length === 0) {
      console.log('모든 펫에 이미지가 이미 존재합니다.');
      return;
    }

    console.log(`이미지가 없는 펫: ${petsWithoutImages.length}개\n`);

    let successCount = 0;

    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < petsWithoutImages.length; i++) {
        const petId = petsWithoutImages[i].pet_id;
        const files = DUMMY_IMAGE_FILES[i % DUMMY_IMAGE_FILES.length];

        await queryRunner.query(
          `INSERT INTO pet_images (pet_id, files) VALUES (?, ?)`,
          [petId, JSON.stringify(files)],
        );

        successCount++;
        console.log(
          `[${i + 1}/${petsWithoutImages.length}] petId: ${petId} - OK`,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }

    console.log('\n========== Summary ==========');
    console.log(`Total: ${petsWithoutImages.length}`);
    console.log(`Success: ${successCount}`);
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
