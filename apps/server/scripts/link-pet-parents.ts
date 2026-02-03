/**
 * CSV 파일을 기반으로 펫의 부모 정보를 연동하는 스크립트
 *
 * 전제조건:
 *   - upsert-pets.ts 스크립트로 펫/분양 정보가 성공적으로 생성되어 있어야 함
 *
 * 실행 방법:
 *   cd apps/server && npx ts-node scripts/link-pet-parents.ts scripts/data/petlist.csv
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { DataSource, QueryRunner } from 'typeorm';

// ==================== 설정 ====================

/** 사용자 ID (직접 할당) - upsert-pets.ts와 동일하게 설정 */
const OWNER_ID = ''; // TODO: 실제 사용자 ID로 변경

// ==================== 타입 정의 ====================

/** CSV 원본 row 타입 */
interface CsvRow {
  종?: string;
  '개체 이름'?: string;
  비공개?: string;
  '해칭일(YYYY-MM-DD)'?: string;
  성별?: string;
  모프?: string;
  형질?: string;
  크기?: string;
  '몸무게(g)'?: string;
  먹이?: string;
  분양상태?: string;
  부개체?: string;
  모개체?: string;
}

/** 부모 연동에 필요한 데이터 */
interface ParentLinkData {
  name: string;
  fatherName: string | null;
  motherName: string | null;
}

/** 에러 정보 */
interface ErrorInfo {
  index: number;
  name: string;
  reason: string;
}

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

// ==================== 유틸 함수 ====================

/** 안전하게 문자열 값 가져오기 */
function safeString(value: string | undefined): string {
  return value?.trim() ?? '';
}

/** CSV row → ParentLinkData 변환 */
function mapCsvRow(row: CsvRow): ParentLinkData {
  return {
    name: safeString(row['개체 이름']),
    fatherName: safeString(row['부개체']) || null,
    motherName: safeString(row['모개체']) || null,
  };
}

/** 이름으로 petId 조회 */
async function getPetIdByName(
  queryRunner: QueryRunner,
  name: string,
  ownerId: string,
): Promise<string | null> {
  const [result] = await queryRunner.query(
    'SELECT pet_id FROM pets WHERE name = ? AND owner_id = ? AND is_deleted = false LIMIT 1',
    [name, ownerId],
  );
  return (result as null | { pet_id: string })?.pet_id ?? null;
}

/** pet_relations 존재 여부 확인 */
async function isPetRelationExists(
  queryRunner: QueryRunner,
  petId: string,
): Promise<boolean> {
  const [existing] = await queryRunner.query(
    'SELECT 1 FROM pet_relations WHERE pet_id = ? LIMIT 1',
    [petId],
  );
  return !!existing;
}

/** parent_requests 존재 여부 확인 */
async function isParentRequestExists(
  queryRunner: QueryRunner,
  childPetId: string,
  parentPetId: string,
  role: 'father' | 'mother',
): Promise<boolean> {
  const [existing] = await queryRunner.query(
    'SELECT 1 FROM parent_requests WHERE child_pet_id = ? AND parent_pet_id = ? AND role = ? LIMIT 1',
    [childPetId, parentPetId, role],
  );
  return !!existing;
}

/** petId로 성별 조회 */
async function getPetSexById(
  queryRunner: QueryRunner,
  petId: string,
): Promise<string | null> {
  const [result] = await queryRunner.query(
    'SELECT sex FROM pet_details WHERE pet_id = ? LIMIT 1',
    [petId],
  );
  return (result as null | { sex: string })?.sex ?? null;
}

/** 부모 성별 검증 */
async function validateParentSex(
  queryRunner: QueryRunner,
  parentPetId: string,
  parentName: string,
  expectedSex: 'M' | 'F',
  role: 'father' | 'mother',
): Promise<void> {
  const sex = await getPetSexById(queryRunner, parentPetId);
  const roleKorean = role === 'father' ? '부개체' : '모개체';
  const expectedSexKorean = expectedSex === 'M' ? '수컷' : '암컷';

  if (!sex) {
    throw new Error(`${roleKorean}(${parentName})의 성별 정보가 없습니다.`);
  }

  if (sex !== expectedSex) {
    const actualSexKorean =
      sex === 'M' ? '수컷' : sex === 'F' ? '암컷' : '미구분';
    throw new Error(
      `${roleKorean}(${parentName})의 성별이 올바르지 않습니다. (기대: ${expectedSexKorean}, 실제: ${actualSexKorean})`,
    );
  }
}

// ==================== 메인 함수 ====================

async function main() {
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error(
      'Usage: npx ts-node scripts/link-pet-parents.ts <csv-file-path>',
    );
    console.error(
      'Example: npx ts-node scripts/link-pet-parents.ts scripts/data/petlist.csv',
    );
    process.exit(1);
  }

  // OWNER_ID 검증
  if (!OWNER_ID) {
    console.error(
      'ERROR: OWNER_ID가 설정되지 않았습니다. 스크립트 상단의 OWNER_ID를 설정해주세요.',
    );
    process.exit(1);
  }

  const absolutePath = path.isAbsolute(csvFilePath)
    ? csvFilePath
    : path.resolve(process.cwd(), csvFilePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`Reading CSV file: ${absolutePath}\n`);

  // CSV 파싱
  const rawRecords: CsvRow[] = [];
  const parser = fs.createReadStream(absolutePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }),
  );

  for await (const record of parser) {
    rawRecords.push(record as CsvRow);
  }

  // 유효한 데이터만 필터링 (name이 있고, 부모 정보가 하나라도 있는 것만)
  const validDataList = rawRecords
    .map(mapCsvRow)
    .filter((value) => !!value.name && (value.fatherName || value.motherName));

  console.log(`Total rows with parent info: ${validDataList.length}\n`);

  if (validDataList.length === 0) {
    console.log('부모 정보가 있는 데이터가 없습니다.');
    process.exit(0);
  }

  // DB 연결
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

  // 에러 수집 배열
  const errors: ErrorInfo[] = [];
  let successCount = 0;
  let skippedCount = 0;

  try {
    for (let i = 0; i < validDataList.length; i++) {
      const data = validDataList[i];

      try {
        // 1. 자식 펫의 pet_id 조회
        const petId = await getPetIdByName(queryRunner, data.name, OWNER_ID);
        if (!petId) {
          throw new Error(`펫을 찾을 수 없습니다: ${data.name}`);
        }

        // 2. 부모 펫의 pet_id 조회
        let fatherId: string | null = null;
        let motherId: string | null = null;

        if (data.fatherName) {
          fatherId = await getPetIdByName(
            queryRunner,
            data.fatherName,
            OWNER_ID,
          );
          if (!fatherId) {
            throw new Error(`부개체를 찾을 수 없습니다: ${data.fatherName}`);
          }
          // 부개체 성별 검증 (수컷이어야 함)
          await validateParentSex(
            queryRunner,
            fatherId,
            data.fatherName,
            'M',
            'father',
          );
        }

        if (data.motherName) {
          motherId = await getPetIdByName(
            queryRunner,
            data.motherName,
            OWNER_ID,
          );
          if (!motherId) {
            throw new Error(`모개체를 찾을 수 없습니다: ${data.motherName}`);
          }
          // 모개체 성별 검증 (암컷이어야 함)
          await validateParentSex(
            queryRunner,
            motherId,
            data.motherName,
            'F',
            'mother',
          );
        }

        // 3. 이미 pet_relations가 존재하는지 확인
        if (await isPetRelationExists(queryRunner, petId)) {
          console.log(
            `[${i + 1}/${validDataList.length}] ${data.name} - SKIPPED (이미 부모 정보 존재)`,
          );
          skippedCount++;
          continue;
        }

        // 트랜잭션 시작
        await queryRunner.startTransaction();

        try {
          // 4. parent_requests 테이블에 insert (father)
          if (fatherId) {
            const exists = await isParentRequestExists(
              queryRunner,
              petId,
              fatherId,
              'father',
            );
            if (!exists) {
              await queryRunner.query(
                `INSERT INTO parent_requests (child_pet_id, parent_pet_id, role, status)
                 VALUES (?, ?, ?, ?)`,
                [petId, fatherId, 'father', 'approved'],
              );
            }
          }

          // 5. parent_requests 테이블에 insert (mother)
          if (motherId) {
            const exists = await isParentRequestExists(
              queryRunner,
              petId,
              motherId,
              'mother',
            );
            if (!exists) {
              await queryRunner.query(
                `INSERT INTO parent_requests (child_pet_id, parent_pet_id, role, status)
                 VALUES (?, ?, ?, ?)`,
                [petId, motherId, 'mother', 'approved'],
              );
            }
          }

          // 6. pet_relations 테이블에 insert
          await queryRunner.query(
            `INSERT INTO pet_relations (pet_id, father_id, mother_id)
             VALUES (?, ?, ?)`,
            [petId, fatherId, motherId],
          );

          // 트랜잭션 커밋
          await queryRunner.commitTransaction();

          successCount++;
          console.log(
            `[${i + 1}/${validDataList.length}] ${data.name} - OK (father: ${data.fatherName ?? 'N/A'}, mother: ${data.motherName ?? 'N/A'})`,
          );
        } catch (error) {
          // 트랜잭션 롤백
          await queryRunner.rollbackTransaction();
          throw error;
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        errors.push({
          index: i + 1,
          name: data.name,
          reason,
        });
        console.error(
          `[${i + 1}/${validDataList.length}] ${data.name} - ERROR: ${reason}`,
        );
      }
    }
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }

  // 결과 요약
  console.log('\n========== Summary ==========');
  console.log(`Total: ${validDataList.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${errors.length}`);

  // 에러 상세 출력
  if (errors.length > 0) {
    console.log('\n========== Errors ==========');
    errors.forEach((err) => {
      console.error(`[Row ${err.index}] ${err.name}: ${err.reason}`);
    });
  }

  console.log('\n=== Done ===');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
