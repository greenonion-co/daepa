/**
 * CSV 파일로부터 펫 데이터를 DB에 일괄 등록하는 스크립트
 *
 * @deprecated 서비스 내재화 완료 — `POST /v1/pet/bulk` API 및 `/pet/bulk` 페이지(사업자 전용) 사용을 권장.
 *             운영자 비상 복구 또는 대규모 초기 마이그레이션 용도로만 유지.
 *             이 스크립트는 `bulkCreatePets` API와 달리 캐시 무효화가 없으므로
 *             운영 DB에 실행한 뒤에는 관련 캐시(`my-pets:*`, `feed:*`, `children:*`,
 *             `ftree:*`, `clutch:*`, `siblings:*`)를 수동 플러시할 것.
 *
 * 실행 방법:
 *   cd apps/server && npx ts-node scripts/upsert-pets.ts scripts/data/sheet.csv
 *
 * 또는 절대 경로로:
 *   cd apps/server && npx ts-node scripts/upsert-pets.ts /path/to/your/file.csv
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { DataSource, QueryRunner } from 'typeorm';
import { nanoid } from 'nanoid';

// ==================== 설정 ====================

/** 사용자 ID (직접 할당) */
const OWNER_ID = ''; // TODO: 실제 사용자 ID로 변경

/** 최대 재시도 횟수 */
const MAX_RETRIES = 5;

// ==================== ID 생성 함수 ====================

/** petId 생성 (중복 체크 포함) */
async function generateUniquePetId(queryRunner: QueryRunner): Promise<string> {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    const petId = nanoid(8);
    const [existing] = await queryRunner.query(
      'SELECT 1 FROM pets WHERE pet_id = ? LIMIT 1',
      [petId],
    );
    if (!existing) {
      return petId;
    }
    attempts++;
  }
  throw new Error('petId 생성 실패: 최대 재시도 횟수 초과');
}

/** adoptionId 생성 */
function generateAdoptionId(): string {
  return nanoid(8);
}

// ==================== 타입 정의 ====================

/** CSV 원본 row 타입 */
interface CsvRow {
  종?: string;
  '개체 이름'?: string;
  공개?: string;
  '해칭일(YYYY-MM-DD)'?: string;
  성별?: string;
  모프?: string;
  형질?: string;
  성장단계?: string;
  크기?: string; // 구 헤더 — backward compat
  몸무게?: string;
  먹이?: string;
  브리더?: string;
  분양상태?: string;
  부개체?: string;
  모개체?: string;
}

/** 변환된 펫 데이터 (한글 → 영어 키) */
interface PetData {
  species: string;
  name: string;
  isPrivate: boolean;
  hatchingDate: string | null;
  sex: string;
  morphs: string[];
  traits: string[];
  growth: string;
  weight: number | null;
  foods: string[];
  isBreeder: boolean;
  adoptionStatus: string;
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

// ==================== CSV 파싱 함수 ====================

/** 안전하게 문자열 값 가져오기 */
function safeString(value: string | undefined): string {
  return value?.trim() ?? '';
}

/** 콤마로 구분된 문자열 → 배열 */
function parseArray(value: string | undefined): string[] {
  const str = safeString(value);
  if (!str) return [];
  return str
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** 숫자 파싱 */
function parseNumber(value: string | undefined): number | null {
  const trimmed = safeString(value);
  if (!trimmed) return null;
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

/** boolean 파싱 */
function parseBoolean(value: string | undefined): boolean {
  return safeString(value).toUpperCase() === 'TRUE';
}

/** CSV row → PetData 변환 */
function mapCsvRow(row: CsvRow): PetData {
  return {
    species: safeString(row['종']),
    name: safeString(row['개체 이름']),
    isPrivate: !parseBoolean(row['공개']),
    hatchingDate: safeString(row['해칭일(YYYY-MM-DD)']) || null,
    sex: safeString(row['성별']),
    morphs: parseArray(row['모프']),
    traits: parseArray(row['형질']),
    growth: safeString(row['성장단계'] ?? row['크기']),
    weight: parseNumber(row['몸무게']),
    foods: parseArray(row['먹이']),
    isBreeder: parseBoolean(row['브리더']),
    adoptionStatus: safeString(row['분양상태']),
    fatherName: safeString(row['부개체']) || null,
    motherName: safeString(row['모개체']) || null,
  };
}

// ==================== DB 매핑 함수 ====================

/** 성별 매핑: 수컷→M, 암컷→F, 미구분→N */
function mapSex(value: string): string | null {
  const sexMap: Record<string, string> = {
    수컷: 'M',
    암컷: 'F',
    미구분: 'N',
  };
  return sexMap[value] ?? null;
}

/** 성장단계 매핑 */
function mapGrowth(value: string): string | null {
  const growthMap: Record<string, string> = {
    성체: 'ADULT',
    준성체: 'PRE_ADULT',
    아성체: 'JUVENILE',
    쥬브나일: 'JUVENILE',
    베이비: 'BABY',
  };
  return growthMap[value] ?? null;
}

/** 분양상태 매핑: NFS→NFS, 분양가능→ON_SALE, 그외→NONE */
function mapAdoptionStatus(value: string): string {
  const statusMap: Record<string, string> = {
    NFS: 'NFS',
    분양가능: 'ON_SALE',
  };
  return statusMap[value] ?? 'NONE';
}

/** 날짜 형식 검증 (yyyy-MM-dd) */
function validateDateFormat(value: string | null): boolean {
  if (!value) return true; // 빈값은 유효
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** 배열을 JSON 문자열로 변환 (빈 배열이면 null) */
function arrayToJson(arr: string[]): string | null {
  if (!arr || arr.length === 0) return null;
  return JSON.stringify(arr);
}

/** 펫 이름 중복 체크 */
async function isPetNameExists(
  queryRunner: QueryRunner,
  name: string,
  ownerId: string,
): Promise<boolean> {
  const [existing] = await queryRunner.query(
    'SELECT 1 FROM pets WHERE name = ? AND owner_id = ? AND is_deleted = false LIMIT 1',
    [name, ownerId],
  );
  return !!existing;
}

// ==================== 메인 함수 ====================

async function main() {
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error('Usage: npx ts-node scripts/upsert-pets.ts <csv-file-path>');
    console.error(
      'Example: npx ts-node scripts/upsert-pets.ts scripts/data/petlist.csv',
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

  // 유효한 데이터만 필터링 (name이 있는 것만)
  const validPetDataList = rawRecords
    .map(mapCsvRow)
    .filter((value) => !!value.name);

  console.log(`Total valid rows: ${validPetDataList.length}\n`);

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

  // 0. OWNER_ID 사용자 존재 검증
  const [owner] = await queryRunner.query(
    'SELECT 1 FROM users WHERE user_id = ? LIMIT 1',
    [OWNER_ID],
  );
  if (!owner) {
    console.error(
      `ERROR: OWNER_ID(${OWNER_ID})에 해당하는 사용자가 존재하지 않습니다.`,
    );
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }

  // 에러 수집 배열
  const errors: ErrorInfo[] = [];
  let successCount = 0;

  try {
    for (let i = 0; i < validPetDataList.length; i++) {
      const pet = validPetDataList[i];

      try {
        // 날짜 형식 검증
        if (!validateDateFormat(pet.hatchingDate)) {
          throw new Error(
            `잘못된 날짜 형식: ${pet.hatchingDate} (yyyy-MM-dd 형식이어야 합니다)`,
          );
        }

        // 펫 이름 중복 체크
        if (await isPetNameExists(queryRunner, pet.name, OWNER_ID)) {
          throw new Error(`이미 존재하는 펫 이름입니다: ${pet.name}`);
        }

        // 트랜잭션 시작
        await queryRunner.startTransaction();

        try {
          // 1. pets 테이블 insert
          const petId = await generateUniquePetId(queryRunner);

          await queryRunner.query(
            `INSERT INTO pets (pet_id, name, species, is_public, is_breeder, hatching_date, type, owner_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              petId,
              pet.name,
              'CR', // species: 모두 CR로 초기화
              !pet.isPrivate, // isPrivate → isPublic 변환
              pet.isBreeder, // isBreeder: CSV '브리더' 필드
              pet.hatchingDate || null,
              'PET', // type: PET으로 초기화
              OWNER_ID,
            ],
          );

          // 1-1. pet_details 테이블 insert
          await queryRunner.query(
            `INSERT INTO pet_details (pet_id, sex, morphs, traits, weight, foods, growth)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              petId,
              mapSex(pet.sex),
              arrayToJson(pet.morphs),
              arrayToJson(pet.traits),
              pet.weight,
              arrayToJson(pet.foods),
              mapGrowth(pet.growth),
            ],
          );

          // 2. adoptions 테이블 insert
          const adoptionId = generateAdoptionId();

          await queryRunner.query(
            `INSERT INTO adoptions (adoption_id, seller_id, pet_id, status)
             VALUES (?, ?, ?, ?)`,
            [
              adoptionId,
              OWNER_ID,
              petId,
              mapAdoptionStatus(pet.adoptionStatus),
            ],
          );

          // 트랜잭션 커밋
          await queryRunner.commitTransaction();

          successCount++;
          console.log(
            `[${i + 1}/${validPetDataList.length}] ${pet.name} - OK (petId: ${petId})`,
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
          name: pet.name,
          reason,
        });
        console.error(
          `[${i + 1}/${validPetDataList.length}] ${pet.name} - ERROR: ${reason}`,
        );
      }
    }
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }

  // 결과 요약
  console.log('\n========== Summary ==========');
  console.log(`Total: ${validPetDataList.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${errors.length}`);

  // 에러 상세 출력
  if (errors.length > 0) {
    console.log('\n========== Errors ==========');
    errors.forEach((err) => {
      console.error(`[Row ${err.index}] ${err.name}: ${err.reason}`);
    });
  }

  console.log('\n=== Done ===');

  // 부모 정보 연동은 별도 스크립트(link-pet-parents.ts)로 실행
  // npx ts-node scripts/link-pet-parents.ts scripts/data/petlist.csv
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
