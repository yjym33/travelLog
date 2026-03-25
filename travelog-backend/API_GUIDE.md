# 📚 Travelog API 사용 가이드

## 목차

1. [인증](#1-인증)
2. [여행 기록 관리](#2-여행-기록-관리)
3. [스토리 생성](#3-스토리-생성)
4. [파일 업로드](#4-파일-업로드)
5. [에러 처리](#5-에러-처리)

---

## 1. 인증

### 1.1 회원가입

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "traveler@example.com",
  "password": "mypassword123",
  "nickname": "세계여행가"
}
```

**응답:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "traveler@example.com",
    "nickname": "세계여행가",
    "profileImage": null
  }
}
```

### 1.2 로그인

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "traveler@example.com",
  "password": "mypassword123"
}
```

**응답:** 회원가입과 동일한 형식

### 1.3 현재 사용자 정보

```bash
GET /api/auth/me
Authorization: Bearer {accessToken}
```

---

## 2. 여행 기록 관리

### 2.1 여행 기록 생성

```bash
POST /api/travels
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "lat": 37.5665,
  "lng": 126.978,
  "placeName": "서울 한강공원",
  "country": "South Korea",
  "emotion": "peaceful",
  "photos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  "diary": "한강에서 바라본 노을이 정말 아름다웠다. 마음이 평온해지는 순간이었어.",
  "tags": ["#한강", "#노을", "#평온", "#서울"]
}
```

**응답:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-id",
  "lat": 37.5665,
  "lng": 126.978,
  "placeName": "서울 한강공원",
  "country": "South Korea",
  "emotion": "peaceful",
  "photos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  "diary": "한강에서 바라본 노을이 정말 아름다웠다...",
  "tags": ["#한강", "#노을", "#평온", "#서울"],
  "createdAt": "2024-10-20T10:30:00.000Z",
  "updatedAt": "2024-10-20T10:30:00.000Z"
}
```

### 2.2 여행 기록 목록 조회 (필터링)

```bash
# 기본 조회
GET /api/travels
Authorization: Bearer {accessToken}

# 필터링 예시
GET /api/travels?emotions=happy,peaceful&countries=South Korea&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {accessToken}
```

**쿼리 파라미터:**

- `emotions`: 감정 필터 (쉼표로 구분)
- `countries`: 국가 필터 (쉼표로 구분)
- `tags`: 태그 필터 (쉼표로 구분)
- `startDate`: 시작 날짜 (YYYY-MM-DD)
- `endDate`: 종료 날짜 (YYYY-MM-DD)

### 2.3 여행 통계 조회

```bash
GET /api/travels/statistics
Authorization: Bearer {accessToken}
```

**응답:**

```json
{
  "totalLogs": 15,
  "uniqueCountries": 5,
  "countries": ["South Korea", "Japan", "United States", "France", "Brazil"],
  "emotionDistribution": {
    "happy": 6,
    "peaceful": 4,
    "excited": 3,
    "nostalgic": 2
  },
  "countryDistribution": {
    "South Korea": 5,
    "Japan": 4,
    "United States": 3,
    "France": 2,
    "Brazil": 1
  },
  "monthlyTravels": {
    "2024-01": 2,
    "2024-03": 3,
    "2024-06": 5,
    "2024-09": 5
  }
}
```

### 2.4 여행 기록 수정

```bash
PATCH /api/travels/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "diary": "수정된 일기 내용",
  "tags": ["#한강", "#노을", "#평온", "#서울", "#추가태그"]
}
```

### 2.5 여행 기록 삭제

```bash
DELETE /api/travels/{id}
Authorization: Bearer {accessToken}
```

---

## 3. 스토리 생성

### 3.1 스토리 생성

```bash
POST /api/stories
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "2024년 여름 아시아 여행",
  "description": "잊을 수 없는 여름, 한국과 일본을 여행한 이야기",
  "coverImage": "https://example.com/cover.jpg",
  "template": "timeline",
  "travelLogIds": [
    "travel-log-id-1",
    "travel-log-id-2",
    "travel-log-id-3"
  ],
  "isPublic": true
}
```

**템플릿 종류:**

- `timeline`: 시간순 타임라인
- `map`: 지도 중심
- `gallery`: 갤러리 그리드
- `mood`: 감정별 분류

**응답:**

```json
{
  "id": "story-id",
  "userId": "user-id",
  "title": "2024년 여름 아시아 여행",
  "description": "잊을 수 없는 여름...",
  "coverImage": "https://example.com/cover.jpg",
  "template": "timeline",
  "isPublic": true,
  "createdAt": "2024-10-20T10:30:00.000Z",
  "updatedAt": "2024-10-20T10:30:00.000Z",
  "storyLogs": [
    {
      "id": "story-log-id-1",
      "order": 0,
      "travelLog": {
        /* 여행 기록 상세 정보 */
      }
    },
    {
      "id": "story-log-id-2",
      "order": 1,
      "travelLog": {
        /* 여행 기록 상세 정보 */
      }
    }
  ]
}
```

### 3.2 공개 스토리 조회

```bash
GET /api/stories/public
```

### 3.3 내 스토리 목록

```bash
GET /api/stories
Authorization: Bearer {accessToken}
```

### 3.4 스토리 수정

```bash
PATCH /api/stories/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "수정된 제목",
  "isPublic": false,
  "travelLogIds": ["new-log-1", "new-log-2"]
}
```

---

## 4. 파일 업로드

### 4.1 단일 이미지 업로드

```bash
POST /api/upload/single
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

# FormData
file: [이미지 파일]
```

**응답:**

```json
{
  "success": true,
  "url": "https://s3.amazonaws.com/travelog-images/travel-photos/uuid.jpg"
}
```

### 4.2 여러 이미지 업로드 (최대 10개)

```bash
POST /api/upload/multiple
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

# FormData
files: [이미지 파일 1]
files: [이미지 파일 2]
files: [이미지 파일 3]
```

**응답:**

```json
{
  "success": true,
  "urls": [
    "https://s3.amazonaws.com/travelog-images/travel-photos/uuid1.jpg",
    "https://s3.amazonaws.com/travelog-images/travel-photos/uuid2.jpg",
    "https://s3.amazonaws.com/travelog-images/travel-photos/uuid3.jpg"
  ]
}
```

### 4.3 JavaScript/TypeScript 예시

```typescript
// 단일 파일 업로드
const uploadSingleImage = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3001/api/upload/single', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.url;
};

// 여러 파일 업로드
const uploadMultipleImages = async (files: File[], token: string) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('http://localhost:3001/api/upload/multiple', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.urls;
};
```

---

## 5. 에러 처리

### 5.1 에러 응답 형식

모든 에러는 다음과 같은 형식으로 반환됩니다:

```json
{
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "Bad Request"
}
```

### 5.2 주요 HTTP 상태 코드

| 코드 | 의미           | 예시                                 |
| ---- | -------------- | ------------------------------------ |
| 200  | 성공           | GET 요청 성공                        |
| 201  | 생성 성공      | POST 요청으로 리소스 생성            |
| 400  | 잘못된 요청    | 유효성 검사 실패                     |
| 401  | 인증 실패      | 토큰 없음 또는 만료                  |
| 403  | 권한 없음      | 다른 사용자의 리소스 접근 시도       |
| 404  | 찾을 수 없음   | 존재하지 않는 리소스                 |
| 409  | 충돌           | 이미 존재하는 이메일로 회원가입 시도 |
| 429  | 요청 제한 초과 | Rate limit 도달                      |
| 500  | 서버 에러      | 예상치 못한 서버 오류                |

### 5.3 유효성 검사 에러 예시

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters",
    "nickname must be longer than or equal to 2 characters"
  ],
  "error": "Bad Request"
}
```

### 5.4 인증 에러 예시

```json
{
  "statusCode": 401,
  "message": "인증 정보가 유효하지 않습니다.",
  "error": "Unauthorized"
}
```

---

## 6. 완전한 워크플로우 예시

### 6.1 사용자 등록 및 여행 기록 생성

```javascript
// 1. 회원가입
const registerResponse = await fetch(
  'http://localhost:3001/api/auth/register',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'traveler@example.com',
      password: 'password123',
      nickname: '여행가',
    }),
  },
);

const { accessToken } = await registerResponse.json();

// 2. 이미지 업로드
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('http://localhost:3001/api/upload/single', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: formData,
});

const { url: photoUrl } = await uploadResponse.json();

// 3. 여행 기록 생성
const travelResponse = await fetch('http://localhost:3001/api/travels', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    lat: 37.5665,
    lng: 126.978,
    placeName: '서울 한강공원',
    country: 'South Korea',
    emotion: 'peaceful',
    photos: [photoUrl],
    diary: '한강에서 바라본 노을이 아름다웠다.',
    tags: ['#한강', '#노을'],
  }),
});

const travelLog = await travelResponse.json();
console.log('여행 기록 생성 완료:', travelLog);
```

---

## 7. React/Next.js 통합 예시

```typescript
// lib/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  // 인증
  register: async (email: string, password: string, nickname: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    });
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  // 여행 기록
  getTravels: async (token: string, filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/travels?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  createTravel: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/travels`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // 파일 업로드
  uploadImage: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/single`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.json();
  },
};
```

---

## 8. Swagger UI

API를 더 쉽게 테스트하려면 Swagger UI를 사용하세요:

1. 서버 실행: `npm run start:dev`
2. 브라우저에서 접속: http://localhost:3001/api/docs
3. 우측 상단 "Authorize" 버튼 클릭
4. 로그인 후 받은 `accessToken` 입력
5. 각 API 엔드포인트를 직접 테스트

---

**도움이 필요하신가요?**

문제가 발생하면 GitHub Issues에 등록해주세요!



