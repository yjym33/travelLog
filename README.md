# 🌍 Travelog – 감성 여행 사진 다이어리

전 세계 지도를 기반으로 다녀온 여행지를 핀으로 남기고, 장소별 감성적인 사진과 일기를 기록할 수 있는 **인터랙티브 여행 다이어리 플랫폼**입니다.

> **감성적 사용자 경험(Emotional UX)**과 고품질 인터랙션 구현을 통해 프론트엔드 역량을 극대화하고, 안정적인 **NestJS 백엔드**를 통해 데이터를 관리합니다.

---

## 🧭 프로젝트 개요

### 🎯 목표
- 감성 중심의 인터랙션 기반 여행 기록 플랫폼 구축
- 지도를 통한 직관적 기록 + 감정 기반 다이어리 제공
- 부드러운 애니메이션과 UI로 몰입도 높은 사용자 경험 제공
- 확장 가능하고 안전한 API 서버 구축 (NestJS + Prisma + PostgreSQL)

### 🔑 주요 기능
- **지도 기반 기록**: 전 세계 지도에 여행지 핀 추가 및 시각화 (Mapbox/Leaflet)
- **감성 다이어리**: 장소별 사진 업로드, 감정 이모지 선택, 일기 작성
- **스토리 기능**: 기록들을 모아 타임라인, 갤러리 등 테마별 스토리 생성
- **통계 시각화**: 내 여행 통계(방문 국가, 감정 분포 등) 확인
- **보안 및 저장**: JWT 기반 인증 및 AWS S3 이미지 저장

---

## 🛠 기술 스택

### Frontend
- **Core**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion (애니메이션)
- **State Management**: Zustand, Recoil
- **Map API**: Mapbox GL JS / Leaflet.js
- **Deployment**: Vercel

### Backend
- **Framework**: NestJS 11.x, TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT + Passport.js
- **File Storage**: AWS S3
- **Documentation**: Swagger (OpenAPI 3.0)

---

## 📁 프로젝트 구조

```text
Travelog/
├── travelog-frontend/     # Next.js 프론트엔드 애플리케이션
│   ├── app/               # 페이지 및 라우팅
│   ├── components/        # 공통 컴포넌트
│   └── stores/            # 상태 관리 (Zustand)
└── travelog-backend/      # NestJS 백엔드 API 서버
    ├── src/               # API 소스 코드 (auth, user, travel, story 등)
    └── prisma/            # 데이터베이스 스키마 및 마이그레이션
```

---

## 🚀 시작하기

### 1. 전제 조건
- Node.js (v18 이상 권장)
- PostgreSQL 데이터베이스 (또는 Docker)

### 2. 백엔드 설정 및 실행
```bash
cd travelog-backend
npm install
cp .env.example .env  # 환경 변수 설정
npx prisma generate
npx prisma migrate dev
npm run start:dev
```
- API 서버: `http://localhost:3001`
- API 문서(Swagger): `http://localhost:3001/api/docs`

### 3. 프론트엔드 설정 및 실행
```bash
cd travelog-frontend
npm install
cp .env.example .env  # 환경 변수 설정 (NEXT_PUBLIC_API_URL 등)
npm run dev
```
- 접속 주소: `http://localhost:3000`

---

## 📸 예시 스크린샷

> ![image](https://github.com/user-attachments/assets/54b93231-22e7-4e31-ac54-23b3943bacf9)

> ![image](https://github.com/user-attachments/assets/4213738a-63be-479c-9ad0-cef9f95ddde8)

> ![image](https://github.com/user-attachments/assets/8da6c6b1-8758-42c4-85a3-abacb433bb38)

---

## 📄 라이선스

이 프로젝트는 오픈 소스이며 상업적 이용 시 문의 바랍니다. (UNLICENSED)
