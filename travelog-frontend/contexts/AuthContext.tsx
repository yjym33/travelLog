"use client";

import { useAuthStore } from "@/stores/authStore";
import { useLogin, useRegister, useLogout } from "@/hooks/useAuthMutations";

/**
 * 인증 관련 훅 (Zustand + React Query 기반)
 */
export function useAuth() {
  // Zustand 스토어에서 상태 가져오기
  const { user, token, isAuthenticated, isHydrated } = useAuthStore();

  // React Query Mutations
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logout = useLogout();

  return {
    user,
    token,
    isAuthenticated,
    isHydrated,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    login: async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    register: async (email: string, password: string, username: string) => {
      await registerMutation.mutateAsync({ email, password, username });
    },
    logout,
  };
}
