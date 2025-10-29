"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본 쿼리 옵션
            staleTime: 1000 * 60, // 1분
            gcTime: 1000 * 60 * 5, // 5분
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 새로고침 비활성화
            retry: 1, // 실패 시 1번만 재시도
          },
          mutations: {
            // 기본 뮤테이션 옵션
            retry: 0, // 실패 시 재시도 안 함
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

