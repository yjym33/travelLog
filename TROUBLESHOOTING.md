# 로그인/회원가입 문제 해결 가이드

## 🔍 발견된 문제점

### 1. **응답 형식 불일치** ✅ 해결됨

- **문제**: 백엔드는 `{ accessToken, user }` 형식으로 응답하지만, 프론트엔드는 `{ success, data: { token, user } }` 형식을 기대
- **해결**: 프론트엔드를 백엔드 응답 형식에 맞게 수정
  - `types/auth.ts`: LoginResponse, RegisterResponse를 `{ accessToken, user }` 형식으로 변경
  - `contexts/AuthContext.tsx`: `accessToken` 필드를 직접 사용하도록 수정
  - `lib/mockApi.ts`: Mock API 응답도 백엔드 형식에 맞게 변경

### 2. **User 타입 불일치** ✅ 해결됨

- **문제**: 프론트엔드는 `username` 필드를 기대했지만, 백엔드는 `nickname` 필드를 사용
- **해결**: `types/auth.ts`의 User 인터페이스를 백엔드 스키마와 일치하도록 수정

### 3. **닉네임 표시 문제** ✅ 해결됨

- **문제**: 로그인 후 사용자 닉네임이 표시되지 않고 "사용자"로만 표시됨
- **원인**: `app/page.tsx`에서 `user?.username`을 사용했으나, User 타입에는 `nickname` 필드만 존재
- **해결**: `app/page.tsx`에서 `user?.nickname`으로 수정

### 4. **환경 변수 누락** ⚠️ 수동 설정 필요

- **문제**: 백엔드에 `.env` 파일이 없어 JWT_SECRET 등의 환경 변수가 설정되지 않음
- **해결 방법**: 아래 설정 참고

## 🛠 필수 설정

### 백엔드 환경 변수 설정

1. `travelog-backend` 폴더에 `.env` 파일을 생성하세요:

```bash
cd travelog-backend
touch .env
```

2. `.env` 파일에 다음 내용을 추가하세요:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/travelog?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"

# AWS S3 (Optional - for file upload)
# AWS_REGION=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET_NAME=
```

3. PostgreSQL 데이터베이스가 실행 중인지 확인하세요:

```bash
# PostgreSQL 상태 확인
pg_ctl status

# 실행되지 않았다면 시작
pg_ctl start
```

4. Prisma 마이그레이션 실행:

```bash
npx prisma migrate dev
```

### 프론트엔드 환경 변수 (선택사항)

프론트엔드의 기본 API URL은 `http://localhost:3001`로 설정되어 있습니다.
변경이 필요한 경우 `travelog-frontend/.env.local` 파일을 생성하고 다음을 추가하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🚀 서버 실행 방법

### 백엔드 서버 시작

```bash
cd travelog-backend
npm install
npm run start:dev
```

서버가 http://localhost:3001 에서 실행되며, Swagger 문서는 http://localhost:3001/api/docs 에서 확인할 수 있습니다.

### 프론트엔드 서버 시작

```bash
cd travelog-frontend
npm install
npm run dev
```

프론트엔드가 http://localhost:3000 에서 실행됩니다.

## ✅ 수정된 파일 목록

### 프론트엔드

1. `types/auth.ts` - User 인터페이스와 응답 타입을 백엔드 스키마에 맞게 수정
2. `contexts/AuthContext.tsx` - accessToken 필드를 직접 사용하도록 로직 수정
3. `lib/api.ts` - 백엔드 응답을 그대로 사용하도록 간소화
4. `lib/mockApi.ts` - Mock API 응답을 백엔드 형식에 맞게 수정
5. `app/page.tsx` - 사용자 닉네임 표시를 `user?.username`에서 `user?.nickname`으로 수정

## 🧪 테스트 방법

1. 백엔드와 프론트엔드 서버를 모두 실행합니다
2. http://localhost:3000/auth/register 로 이동합니다
3. 새 계정을 생성합니다:
   - 이메일: test@example.com
   - 비밀번호: test1234
   - 사용자명: testuser
4. 회원가입이 성공하면 자동으로 메인 페이지로 리다이렉트됩니다
5. 로그아웃 후 http://localhost:3000/auth/login 에서 로그인을 테스트합니다

## 🐛 문제가 계속되는 경우

### 데이터베이스 연결 오류

- PostgreSQL이 실행 중인지 확인
- DATABASE_URL이 올바른지 확인
- 데이터베이스가 생성되어 있는지 확인: `createdb travelog`

### JWT 오류

- .env 파일에 JWT_SECRET이 설정되어 있는지 확인
- 백엔드 서버를 재시작

### CORS 오류

- 백엔드의 main.ts에서 CORS 설정 확인
- FRONTEND_URL 환경 변수가 올바른지 확인

### 네트워크 오류

- 브라우저 개발자 도구의 Network 탭에서 요청 URL 확인
- 백엔드가 http://localhost:3001/api/auth/login 경로로 요청을 받는지 확인
