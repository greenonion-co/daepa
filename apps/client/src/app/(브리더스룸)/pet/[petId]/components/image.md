# 펫 이미지 업로드 아키텍처

## 업로드 흐름

**클라이언트 압축 + Presigned URL 직접 업로드** 방식.

```
┌──────────┐                                   ┌──────────────┐
│          │  1. 클라이언트 압축                  │              │
│  브라우저  │  (1600px, WebP, quality 0.82)      │  Next.js API │
│          │                                    │   (인증+발급)  │
│          │  2. POST /api/upload/presigned-url  │              │
│          │  { petId, mimeType, size }          │              │
│          │ ──────────────── JSON ─────────────▶│              │
│          │ ◀─── { presignedUrl, fileName } ─── │              │
└────┬─────┘                                    └──────────────┘
     │
     │  3. PUT presignedUrl (압축된 파일)
     │  ※ 서버를 거치지 않고 직접 전송
     ▼
┌──────────────┐
│ Cloudflare R2 │
│   (스토리지)   │
└──────────────┘
```

> 1. 브라우저에서 이미지를 **WebP로 압축** 후 (5MB → ~200-500KB)
> 2. 서버는 presigned URL만 발급하고, **압축된 파일을 브라우저에서 R2로 직접** 전송한다.
> 3. 서버 메모리에 파일이 적재되지 않아 업로드 속도가 대폭 향상되고 서버 부하도 감소한다.

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `DndImagePicker.tsx` | 이미지 선택·압축·업로드·정렬 UI 컴포넌트 |
| `ImagesContent.tsx` | 펫 상세 페이지의 이미지 섹션 (상태 관리, 낙관적 업데이트) |
| `/api/upload/presigned-url/route.ts` | JWT 인증 후 presigned URL 발급 |
| `lib/vendor/cloudflare/r2.service.ts` | S3 SDK로 presigned URL 생성 (`getPresignedUploadUrl`) |
| `lib/utils.tsx` | `compressImageFile()` — 업로드 전 이미지 압축 |

## 업로드 단계 상세

### 0단계: 클라이언트 압축 (브라우저)

`compressImageFile()` (`lib/utils.tsx`)이 업로드 전에 이미지를 압축한다.

- Canvas API로 최대 **1600px**에 맞춰 리사이즈 (CDN xl 트랜스폼과 동일)
- **WebP** 포맷으로 변환 (quality 0.82)
- 압축 결과를 새 `File` 객체로 반환 → presigned URL 요청에 사용

**압축 스킵 조건:**
- GIF 파일 (애니메이션 보존)
- 이미 1600px 이하 + 500KB 이하인 이미지
- Canvas 처리 실패 시 원본 그대로 폴백

**R2에 원본이 아닌 압축본이 저장된다.** 최대 표시 크기(xl: 1600px)와 동일하게 압축하므로 화질 차이는 없다.

### 1단계: Presigned URL 발급 (서버)

```
POST /api/upload/presigned-url
Authorization: Bearer {JWT}
Body: { petId: "pet-abc", mimeType: "image/jpeg", size: 2048000 }
```

- JWT 인증 검증
- mimeType (`image/*` 만 허용), size (10MB 제한) 검증
- R2 키 생성: `{petId}/{nanoid(10)}` (예: `pet-abc/a1b2c3d4e5`)
- `@aws-sdk/s3-request-presigner`로 5분 만료 presigned PUT URL 발급

### 2단계: R2 직접 업로드 (브라우저)

```
PUT {presignedUrl}
Content-Type: image/jpeg
Body: [파일 바이너리]
```

- 브라우저에서 R2로 직접 PUT 요청
- 서버를 경유하지 않으므로 파일 크기만큼의 네트워크 왕복 1회 절약
- 여러 이미지 선택 시 `Promise.all`로 병렬 업로드

### 3단계: 메타데이터 저장 (서버)

```
PUT /api/v1/pet-image/{petId}
Body: { files: [{ fileName, url, mimeType, size }, ...] }
```

- 업로드 완료된 이미지 메타데이터를 NestJS 서버에 저장
- `petId`로 키가 시작되므로 `PENDING/` → `petId/` CopyObject 불필요
- DB에 이미지 목록 upsert

## R2 키 정책

| 상황 | 키 형식 | CopyObject 필요 |
|------|---------|----------------|
| 펫 상세 (petId 존재) | `{petId}/{nanoid}` | 불필요 |
| 펫 등록 (petId 미확정) | `PENDING/{nanoid}` | 서버 저장 시 복사 |

`DndImagePicker`에 `petId` prop을 전달하면 최종 경로로 바로 업로드된다.

## CORS 요구사항

R2 버킷에 아래 CORS 규칙이 필요하다 (Cloudflare Dashboard → R2 → Settings → CORS policy):

- **Allowed Origins**: 클라이언트 도메인들
- **Allowed Methods**: `PUT`
- **Allowed Headers**: `Content-Type`

## 이미지 표시 (CDN Transform)

저장된 이미지(압축된 WebP)는 Cloudflare CDN Transform으로 요청 시점에 추가 리사이즈된다.

| 용도 | 변환 규격 | 사용처 |
|------|----------|--------|
| 썸네일 (sm) | 320×320 webp | 목록, 그리드 |
| 미리보기 (lg) | 800×800 webp | 상세 페이지 프리뷰 |
| 전체화면 (xl) | 1600×1600 webp | ImageViewer |
