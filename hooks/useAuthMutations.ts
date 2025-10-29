import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

/**
 * 로그인 Mutation
 */
export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return await authApi.login(email, password);
    },
    onSuccess: (data) => {
      // Zustand 스토어에 인증 정보 저장
      setAuth(data.user, data.accessToken);
      // 메인 페이지로 리다이렉트
      router.push("/");
    },
    onError: (error) => {
      console.error("로그인 실패:", error);
      throw error;
    },
  });
};

/**
 * 회원가입 Mutation
 */
export const useRegister = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({
      email,
      password,
      username,
    }: {
      email: string;
      password: string;
      username: string;
    }) => {
      return await authApi.register(email, password, username);
    },
    onSuccess: (data) => {
      // Zustand 스토어에 인증 정보 저장
      setAuth(data.user, data.accessToken);
      // 메인 페이지로 리다이렉트
      router.push("/");
    },
    onError: (error) => {
      console.error("회원가입 실패:", error);
      throw error;
    },
  });
};

/**
 * 로그아웃
 */
export const useLogout = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return () => {
    // Zustand 스토어에서 인증 정보 제거
    clearAuth();
    // 로그인 페이지로 리다이렉트
    router.push("/auth/login");
  };
};

