# 🌍 Travelog Backend

**감성 여행 사진 다이어리 백엔드 API**

NestJS 기반의 RESTful API 서버로, PostgreSQL 데이터베이스와 Prisma ORM을 사용합니다.

---

## 📚 기술 스택

| 범주                  | 기술                                    |
| --------------------- | --------------------------------------- |
| **Framework**         | NestJS 11.x                             |
| **Language**          | TypeScript 5.x                          |
| **Database**          | PostgreSQL                              |
| **ORM**               | Prisma                                  |
| **Authentication**    | JWT + Passport.js                       |
| **Validation**        | class-validator, class-transformer      |
| **File Storage**      | AWS S3                                  |
| **API Documentation** | Swagger (OpenAPI 3.0)                   |
| **Security**          | Throttler (Rate Limiting), CORS, Helmet |

---

## 🚀 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정하세요.

```bash
cp .env.example .env
```

`.env` 파일 내용:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/travelog?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"

# AWS S3
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="travelog-images"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### 3. PostgreSQL 데이터베이스 준비

Docker를 사용하는 경우:

```bash
docker run --name travelog-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=travelog \
  -p 5432:5432 \
  -d postgres:16
```

### 4. Prisma 마이그레이션

```bash
# Prisma Client 생성
npx prisma generate

# 데이터베이스 마이그레이션 실행
npx prisma migrate dev --name init

# (선택사항) Prisma Studio로 데이터 확인
npx prisma studio
```

### 5. 서버 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

서버가 실행되면:

- 🚀 API 서버: http://localhost:3001
- 📚 Swagger 문서: http://localhost:3001/api/docs

---

## 📁 프로젝트 구조

```
src/
├── auth/                    # 인증 모듈 (JWT, Passport)
│   ├── dto/                 # 로그인/회원가입 DTO
│   ├── guards/              # JWT 인증 가드
│   ├── strategies/          # Passport JWT 전략
│   └── decorators/          # @GetUser 커스텀 데코레이터
├── user/                    # 사용자 모듈
│   ├── dto/                 # 사용자 업데이트 DTO
│   ├── user.service.ts      # 사용자 비즈니스 로직
│   └── user.controller.ts   # 사용자 API 엔드포인트
├── travel/                  # 여행 기록 모듈
│   ├── dto/                 # 여행 기록 CRUD DTO
│   ├── travel.service.ts    # 여행 기록 비즈니스 로직
│   └── travel.controller.ts # 여행 기록 API 엔드포인트
├── story/                   # 스토리 모듈
│   ├── dto/                 # 스토리 CRUD DTO
│   ├── story.service.ts     # 스토리 비즈니스 로직
│   └── story.controller.ts  # 스토리 API 엔드포인트
├── upload/                  # 파일 업로드 모듈
│   ├── upload.service.ts    # AWS S3 업로드 로직
│   └── upload.controller.ts # 파일 업로드 API
├── prisma/                  # Prisma 모듈
│   ├── prisma.service.ts    # Prisma Client 서비스
│   └── prisma.module.ts     # Prisma 모듈
├── app.module.ts            # 루트 모듈
└── main.ts                  # 애플리케이션 진입점
```

---

## 🔐 API 인증

대부분의 API는 JWT 토큰을 통한 인증이 필요합니다.

### 1. 회원가입

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "여행가"
}
```

### 2. 로그인

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "여행가",
    "profileImage": null
  }
}
```

### 3. 인증이 필요한 요청

```bash
GET /api/travels
Authorization: Bearer {accessToken}
```

---

## 📖 주요 API 엔드포인트

### 인증 (Auth)

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | 회원가입              |
| POST   | `/api/auth/login`    | 로그인                |
| GET    | `/api/auth/me`       | 현재 사용자 정보 조회 |

### 사용자 (User)

| Method | Endpoint              | Description  |
| ------ | --------------------- | ------------ |
| GET    | `/api/users/me`       | 내 정보 조회 |
| GET    | `/api/users/me/stats` | 내 통계 조회 |
| PATCH  | `/api/users/me`       | 내 정보 수정 |
| DELETE | `/api/users/me`       | 회원 탈퇴    |

### 여행 기록 (Travel)

| Method | Endpoint                  | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| POST   | `/api/travels`            | 여행 기록 생성                       |
| GET    | `/api/travels`            | 내 여행 기록 목록 조회 (필터링 가능) |
| GET    | `/api/travels/statistics` | 여행 통계 조회                       |
| GET    | `/api/travels/:id`        | 여행 기록 상세 조회                  |
| PATCH  | `/api/travels/:id`        | 여행 기록 수정                       |
| DELETE | `/api/travels/:id`        | 여행 기록 삭제                       |

**필터링 파라미터:**

- `emotions`: 감정 필터 (예: `happy,peaceful`)
- `countries`: 국가 필터 (예: `South Korea,Japan`)
- `tags`: 태그 필터 (예: `#한강,#노을`)
- `startDate`: 시작 날짜 (YYYY-MM-DD)
- `endDate`: 종료 날짜 (YYYY-MM-DD)

### 스토리 (Story)

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| POST   | `/api/stories`        | 스토리 생성           |
| GET    | `/api/stories`        | 내 스토리 목록 조회   |
| GET    | `/api/stories/public` | 공개 스토리 목록 조회 |
| GET    | `/api/stories/:id`    | 스토리 상세 조회      |
| PATCH  | `/api/stories/:id`    | 스토리 수정           |
| DELETE | `/api/stories/:id`    | 스토리 삭제           |

### 파일 업로드 (Upload)

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/api/upload/single`   | 단일 파일 업로드             |
| POST   | `/api/upload/multiple` | 여러 파일 업로드 (최대 10개) |

---

## 🗄️ 데이터베이스 스키마

### User (사용자)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password     String
  nickname     String
  profileImage String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  travelLogs   TravelLog[]
  stories      Story[]
}
```

### TravelLog (여행 기록)

```prisma
model TravelLog {
  id        String   @id @default(uuid())
  userId    String
  lat       Float
  lng       Float
  placeName String
  country   String
  emotion   String
  photos    String[]
  diary     String
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
  storyLogs StoryLog[]
}
```

### Story (스토리)

```prisma
model Story {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String
  coverImage  String?
  template    String   # 'timeline' | 'map' | 'gallery' | 'mood'
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  storyLogs   StoryLog[]
}
```

---

## 🔒 보안 기능

1. **JWT 인증**: 토큰 기반 stateless 인증
2. **비밀번호 해싱**: bcrypt로 안전하게 저장
3. **Rate Limiting**: 분당 100회 요청 제한
4. **CORS**: 프론트엔드 도메인만 허용
5. **Validation**: DTO 기반 입력값 검증
6. **Authorization**: 리소스 소유자만 수정/삭제 가능

---

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

---

## 📝 Prisma 유용한 명령어

```bash
# Prisma Studio 실행 (GUI 데이터 관리)
npx prisma studio

# 스키마 포맷팅
npx prisma format

# 마이그레이션 생성
npx prisma migrate dev --name migration_name

# 프로덕션 마이그레이션 적용
npx prisma migrate deploy

# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
npx prisma migrate reset
```

---

## 🚧 개발 가이드

### 새로운 모듈 추가

```bash
# 모듈 생성
nest g module feature-name

# 컨트롤러 생성
nest g controller feature-name

# 서비스 생성
nest g service feature-name
```

### DTO 생성 패턴

```typescript
// create-feature.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ example: 'example', description: '설명' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

---

## 📦 배포

### 환경 변수 설정

프로덕션 환경에서는 다음 환경 변수를 반드시 설정하세요:

- `DATABASE_URL`: 프로덕션 PostgreSQL URL
- `JWT_SECRET`: 강력한 시크릿 키
- `AWS_ACCESS_KEY_ID`: AWS 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS 시크릿 키
- `FRONTEND_URL`: 프론트엔드 도메인

### Docker 배포

```dockerfile
# Dockerfile 예시
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

---

## 🐛 트러블슈팅

### Prisma 연결 오류

```bash
# Prisma Client 재생성
npx prisma generate

# 데이터베이스 연결 테스트
npx prisma db push
```

### JWT 인증 오류

- `.env` 파일에 `JWT_SECRET`이 설정되어 있는지 확인
- 토큰이 `Bearer {token}` 형식으로 전송되는지 확인

### AWS S3 업로드 오류

- IAM 권한 확인 (s3:PutObject, s3:DeleteObject)
- 버킷 이름과 리전이 올바른지 확인
- CORS 정책이 설정되어 있는지 확인

---

## 📄 라이선스

UNLICENSED

---

## 👨‍💻 개발자

**Travelog Backend Team**
# travelLog-Backend
