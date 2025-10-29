# 상태 관리 구조 (Zustand + React Query)

이 프로젝트는 **Zustand**와 **React Query**를 사용하여 상태를 관리합니다.

## 📋 아키텍처 개요

### 상태 관리 전략
- **클라이언트 상태 (Zustand)**: UI 상태, 임시 데이터, 사용자 선택 등
- **서버 상태 (React Query)**: API 데이터, 캐싱, 비동기 상태 관리

## 🗂️ 폴더 구조

```
travelog-frontend/
├── stores/               # Zustand 스토어
│   ├── authStore.ts     # 인증 상태 (persist)
│   ├── uiStore.ts       # UI 상태 (모달, 필터, 로딩 등)
│   └── travelStore.ts   # 여행 기록 클라이언트 상태
├── hooks/               # React Query 훅
│   ├── useTravelQueries.ts  # 여행 기록 CRUD
│   └── useAuthMutations.ts  # 인증 관련 Mutations
└── providers/
    └── QueryProvider.tsx     # React Query Provider
```

## 📦 Zustand 스토어

### 1. `authStore.ts` - 인증 상태
**목적**: 사용자 인증 정보를 관리하고 localStorage에 persist

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
}
```

**특징**:
- `persist` 미들웨어로 localStorage에 자동 저장
- 앱 재시작 시 자동으로 인증 상태 복원
- 로그인/로그아웃 시 자동으로 persist

**사용 예시**:
```typescript
import { useAuthStore } from "@/stores/authStore";

function MyComponent() {
  const { user, token, isAuthenticated } = useAuthStore();
  const { setAuth, clearAuth } = useAuthStore();
  
  // 상태 사용...
}
```

### 2. `uiStore.ts` - UI 상태
**목적**: 모달, 필터, 뷰 모드 등 UI 관련 상태 관리

```typescript
interface UIState {
  viewMode: "map" | "gallery" | "timeline" | "stats" | "globe";
  isModalOpen: boolean;
  isShareModalOpen: boolean;
  isStoryCreatorOpen: boolean;
  isFilterPanelOpen: boolean;
  filters: FilterState;
  isGlobalLoading: boolean;
  loadingMessage: string;
}
```

**특징**:
- 모든 모달 상태 중앙 관리
- 필터 상태 관리 (resetFilters로 초기화 가능)
- 전역 로딩 상태 관리

**사용 예시**:
```typescript
import { useUIStore } from "@/stores/uiStore";

function MyComponent() {
  const {
    viewMode,
    setViewMode,
    isModalOpen,
    openModal,
    closeModal,
    filters,
    setFilters,
    resetFilters,
  } = useUIStore();
  
  // UI 상태 사용...
}
```

### 3. `travelStore.ts` - 여행 기록 클라이언트 상태
**목적**: 선택된 여행 기록 등 클라이언트 전용 상태

```typescript
interface TravelState {
  selectedLog: TravelLog | null;
}

interface TravelActions {
  selectLog: (log: TravelLog | null) => void;
}
```

**특징**:
- 서버 데이터는 React Query가 관리
- 클라이언트 전용 상태만 Zustand로 관리

## 🔄 React Query 훅

### 1. `useTravelQueries.ts` - 여행 기록 CRUD

#### 쿼리 (Queries)
**`useTravelLogs(token)`**: 여행 기록 목록 조회

```typescript
const { data: travelLogs = [], isLoading, error } = useTravelLogs(token);
```

**특징**:
- 5분간 캐시 유지 (staleTime)
- 30분간 가비지 컬렉션 방지 (gcTime)
- token이 있을 때만 쿼리 실행 (enabled)

#### 뮤테이션 (Mutations)
**`useCreateTravelLog()`**: 여행 기록 생성

```typescript
const createMutation = useCreateTravelLog();

await createMutation.mutateAsync({
  token,
  data: {
    lat: 37.5665,
    lng: 126.9780,
    placeName: "서울",
    country: "대한민국",
    emotion: "happy",
    photos: [],
    diary: "서울 여행",
    tags: ["#서울"],
  },
});
```

**`useUpdateTravelLog()`**: 여행 기록 수정

```typescript
const updateMutation = useUpdateTravelLog();

await updateMutation.mutateAsync({
  token,
  id: "log-id",
  data: {
    placeName: "부산",
    emotion: "excited",
    // ...
  },
});
```

**`useDeleteTravelLog()`**: 여행 기록 삭제

```typescript
const deleteMutation = useDeleteTravelLog();

await deleteMutation.mutateAsync({
  token,
  id: "log-id",
});
```

**`useDeleteAllTravelLogs()`**: 여행 기록 일괄 삭제

```typescript
const deleteAllMutation = useDeleteAllTravelLogs();

await deleteAllMutation.mutateAsync({
  token,
  logs: travelLogs,
});
```

**특징**:
- 뮤테이션 성공 시 자동으로 쿼리 무효화 (invalidateQueries)
- 낙관적 업데이트(Optimistic Updates) 지원 가능
- 에러 핸들링 자동화

### 2. `useAuthMutations.ts` - 인증 관련

**`useLogin()`**: 로그인

```typescript
const loginMutation = useLogin();

await loginMutation.mutateAsync({
  email: "user@example.com",
  password: "password123",
});
```

**`useRegister()`**: 회원가입

```typescript
const registerMutation = useRegister();

await registerMutation.mutateAsync({
  email: "user@example.com",
  password: "password123",
  username: "사용자명",
});
```

**`useLogout()`**: 로그아웃

```typescript
const logout = useLogout();

logout(); // 함수로 직접 호출
```

**특징**:
- 성공 시 Zustand authStore에 자동 저장
- 성공 시 자동으로 페이지 리다이렉트
- 에러 핸들링 자동화

## 🔌 Provider 설정

### `QueryProvider.tsx`
React Query Provider를 설정하고 DevTools를 제공합니다.

```typescript
// app/layout.tsx
import QueryProvider from "@/providers/QueryProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

**설정**:
- 기본 staleTime: 1분
- 기본 gcTime: 5분
- 윈도우 포커스 시 자동 새로고침 비활성화
- 실패 시 1번만 재시도
- 개발 환경에서 DevTools 활성화

## 🔧 훅 사용 예시

### 인증 관련
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, token, isAuthenticated, isLoading, login, logout } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login("user@example.com", "password");
      // 성공 시 자동 리다이렉트
    } catch (error) {
      console.error("로그인 실패:", error);
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>환영합니다, {user?.nickname}님!</p>
      ) : (
        <button onClick={handleLogin} disabled={isLoading}>
          로그인
        </button>
      )}
    </div>
  );
}
```

### 여행 기록 CRUD
```typescript
import { useTravelLogs, useCreateTravelLog, useUpdateTravelLog, useDeleteTravelLog } from "@/hooks/useTravelQueries";
import { useAuthStore } from "@/stores/authStore";

function TravelList() {
  const { token } = useAuthStore();
  
  // 쿼리
  const { data: travelLogs = [], isLoading } = useTravelLogs(token);
  
  // 뮤테이션
  const createMutation = useCreateTravelLog();
  const updateMutation = useUpdateTravelLog();
  const deleteMutation = useDeleteTravelLog();
  
  const handleCreate = async () => {
    await createMutation.mutateAsync({
      token,
      data: { /* ... */ },
    });
  };
  
  const handleUpdate = async (id: string) => {
    await updateMutation.mutateAsync({
      token,
      id,
      data: { /* ... */ },
    });
  };
  
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ token, id });
  };
  
  if (isLoading) return <div>로딩 중...</div>;
  
  return (
    <ul>
      {travelLogs.map((log) => (
        <li key={log.id}>
          {log.placeName}
          <button onClick={() => handleUpdate(log.id)}>수정</button>
          <button onClick={() => handleDelete(log.id)}>삭제</button>
        </li>
      ))}
      <button onClick={handleCreate}>새 여행 기록 추가</button>
    </ul>
  );
}
```

### UI 상태 관리
```typescript
import { useUIStore } from "@/stores/uiStore";

function MyComponent() {
  const {
    viewMode,
    setViewMode,
    isModalOpen,
    openModal,
    closeModal,
    filters,
    setFilters,
    resetFilters,
    setGlobalLoading,
  } = useUIStore();
  
  const handleSave = async () => {
    setGlobalLoading(true, "저장 중...");
    try {
      // 저장 로직...
    } finally {
      setGlobalLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={() => setViewMode("map")}>지도 뷰</button>
      <button onClick={openModal}>모달 열기</button>
      <button onClick={resetFilters}>필터 초기화</button>
    </div>
  );
}
```

## 🎯 베스트 프랙티스

### 1. 클라이언트 vs 서버 상태 구분
- **Zustand (클라이언트 상태)**: UI 상태, 사용자 선택, 임시 데이터
- **React Query (서버 상태)**: API 데이터, 캐싱, 비동기 작업

### 2. Query Key 관리
```typescript
// 일관된 Query Key 구조 사용
export const travelKeys = {
  all: ["travels"] as const,
  lists: () => [...travelKeys.all, "list"] as const,
  list: (token: string) => [...travelKeys.lists(), token] as const,
  details: () => [...travelKeys.all, "detail"] as const,
  detail: (id: string) => [...travelKeys.details(), id] as const,
};
```

### 3. 에러 핸들링
```typescript
const createMutation = useCreateTravelLog();

try {
  await createMutation.mutateAsync({ token, data });
} catch (error) {
  console.error("여행 기록 저장 실패:", error);
  alert("저장에 실패했습니다. 다시 시도해주세요.");
}
```

### 4. 로딩 상태 관리
```typescript
// 전역 로딩
const { setGlobalLoading } = useUIStore();

setGlobalLoading(true, "데이터를 불러오는 중...");
try {
  // 작업...
} finally {
  setGlobalLoading(false);
}

// 개별 로딩
const { isLoading } = useTravelLogs(token);
if (isLoading) return <div>로딩 중...</div>;
```

### 5. 캐싱 전략
```typescript
// 데이터 변경 후 자동 새로고침
const updateMutation = useUpdateTravelLog();

updateMutation.mutate(
  { token, id, data },
  {
    onSuccess: () => {
      // React Query가 자동으로 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: travelKeys.list(token),
      });
    },
  }
);
```

## 🐛 디버깅

### React Query DevTools
개발 환경에서 자동으로 활성화됩니다:
- 브라우저 하단에 React Query 아이콘 표시
- 쿼리 상태, 캐시, 네트워크 요청 확인 가능

### Zustand DevTools
브라우저 개발자 도구에서 확인:
```typescript
// Redux DevTools Extension 사용 가능
const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({ /* ... */ }),
      { name: "auth-storage" }
    )
  )
);
```

## 📚 참고 자료

- [Zustand 공식 문서](https://docs.pmnd.rs/zustand)
- [React Query 공식 문서](https://tanstack.com/query/latest)
- [상태 관리 비교](https://github.com/pmndrs/zustand#comparison)

