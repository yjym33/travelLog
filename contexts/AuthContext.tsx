"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthContextType, AuthState, User } from "@/types/auth";
import { authApi } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  // 로컬 스토리지에서 토큰과 사용자 정보 복원
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem("travelog_token");
        const userStr = localStorage.getItem("travelog_user");

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("인증 정보 복원 실패:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await authApi.login(email, password);
        const { user, accessToken } = response;

        // 로컬 스토리지에 저장
        localStorage.setItem("travelog_token", accessToken);
        localStorage.setItem("travelog_user", JSON.stringify(user));

        setAuthState({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // 메인 페이지로 리다이렉트
        router.push("/");
      } catch (error) {
        console.error("Login Error:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await authApi.register(email, password, username);
        const { user, accessToken } = response;

        // 로컬 스토리지에 저장
        localStorage.setItem("travelog_token", accessToken);
        localStorage.setItem("travelog_user", JSON.stringify(user));

        setAuthState({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // 메인 페이지로 리다이렉트
        router.push("/");
      } catch (error) {
        console.error("Register Error:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    // 로컬 스토리지에서 제거
    localStorage.removeItem("travelog_token");
    localStorage.removeItem("travelog_user");

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // 로그인 페이지로 리다이렉트
    router.push("/auth/login");
  }, [router]);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
