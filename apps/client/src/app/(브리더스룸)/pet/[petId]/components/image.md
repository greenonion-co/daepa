# 펫 이미지 업로드 아키텍처

## 업로드 흐름

Presigned URL을 사용한 **브라우저 → R2 직접 업로드** 방식.

```
┌──────────┐  POST /api/upload/presigned-url  ┌──────────────┐
│          │  { petId, mimeType, size }        │              │
│  브라우저  │ ──────────────── JSON ──────────▶ │  Next.js API │
│          │ ◀─── { presignedUrl, fileName } ── │   (인증+발급)  │
└────┬─────┘                                   └──────────────┘
     │
     │  PUT presignedUrl (파일 바이너리)
     │  ※ 서버를 거치지 않고 직접 전송
     ▼
┌──────────────┐
│ Cloudflare R2 │
│   (스토리지)   │
└──────────────┘
```

> 서버는 presigned URL만 발급하고, **실제 파일은 브라우저에서 R2로 직접** 전송한다.
> 서버 메모리에 파일이 적재되지 않아 업로드 속도가 ~50% 향상되고 서버 부하도 감소한다.

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `DndImagePicker.tsx` | 이미지 선택·업로드·정렬 UI 컴포넌트 |
| `ImagesContent.tsx` | 펫 상세 페이지의 이미지 섹션 (상태 관리, 낙관적 업데이트) |
| `/api/upload/presigned-url/route.ts` | JWT 인증 후 presigned URL 발급 |
| `lib/vendor/cloudflare/r2.service.ts` | S3 SDK로 presigned URL 생성 (`getPresignedUploadUrl`) |

## 업로드 단계 상세

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

저장된 원본 이미지는 Cloudflare CDN Transform으로 요청 시점에 리사이즈된다.

| 용도 | 변환 규격 | 사용처 |
|------|----------|--------|
| 썸네일 (sm) | 320×320 webp | 목록, 그리드 |
| 미리보기 (lg) | 800×800 webp | 상세 페이지 프리뷰 |
| 전체화면 (xl) | 1600×1600 webp | ImageViewer |
