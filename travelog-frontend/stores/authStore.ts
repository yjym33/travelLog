import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

// 인증 상태 타입 정의
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

// 인증 액션 타입 정의
interface AuthActions {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
  setHydrated: (isHydrated: boolean) => void;
}

// 전체 인증 스토어 타입
type AuthStore = AuthState & AuthActions;

// 인증 스토어 생성 (localStorage에 persist)
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // 초기 상태
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      // 인증 정보 설정
      setAuth: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      // 인증 정보 제거
      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // 인증 초기화 (앱 시작 시)
      initializeAuth: () => {
        // persist 미들웨어가 자동으로 처리
      },

      setHydrated: (isHydrated: boolean) => {
        set({ isHydrated });
      },
    }),
    {
      name: "travelog-auth-storage", // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("인증 상태 복원 중 오류 발생:", error);
          state?.setHydrated(true);
          return;
        }
        state?.setHydrated(true);
      },
    }
  )
);
