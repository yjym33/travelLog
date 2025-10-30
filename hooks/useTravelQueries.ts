import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { travelApi } from "@/lib/api";
import type { TravelLog } from "@/types/travel";
import type { CreateTravelRequest, UpdateTravelRequest } from "@/lib/api";

// Query Keys
export const travelKeys = {
  all: ["travels"] as const,
  lists: () => [...travelKeys.all, "list"] as const,
  list: (token: string) => [...travelKeys.lists(), token] as const,
  details: () => [...travelKeys.all, "detail"] as const,
  detail: (id: string) => [...travelKeys.details(), id] as const,
};

/**
 * 여행 기록 목록 조회
 */
export const useTravelLogs = (token: string | null) => {
  return useQuery({
    queryKey: travelKeys.list(token || ""),
    queryFn: async () => {
      if (!token) throw new Error("인증이 필요합니다.");
      return await travelApi.getList(token);
    },
    enabled: !!token, // token이 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    gcTime: 1000 * 60 * 30, // 30분간 가비지 컬렉션 방지
  });
};

/**
 * 여행 기록 생성
 */
export const useCreateTravelLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: CreateTravelRequest;
    }) => {
      return await travelApi.create(token, data);
    },
    onSuccess: (_, variables) => {
      // 목록 쿼리 무효화하여 자동 새로고침
      queryClient.invalidateQueries({
        queryKey: travelKeys.list(variables.token),
      });
    },
    onError: (error) => {
      console.error("여행 기록 생성 실패:", error);
    },
  });
};

/**
 * 여행 기록 수정
 */
export const useUpdateTravelLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      id,
      data,
    }: {
      token: string;
      id: string;
      data: UpdateTravelRequest;
    }) => {
      return await travelApi.update(token, id, data);
    },
    onSuccess: (_, variables) => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: travelKeys.list(variables.token),
      });
      // 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: travelKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      console.error("여행 기록 수정 실패:", error);
    },
  });
};

/**
 * 여행 기록 삭제
 */
export const useDeleteTravelLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, id }: { token: string; id: string }) => {
      return await travelApi.delete(token, id);
    },
    onSuccess: (_, variables) => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: travelKeys.list(variables.token),
      });
    },
    onError: (error) => {
      console.error("여행 기록 삭제 실패:", error);
    },
  });
};

/**
 * 여행 기록 일괄 삭제
 */
export const useDeleteAllTravelLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      logs,
    }: {
      token: string;
      logs: TravelLog[];
    }) => {
      // 모든 여행 기록 삭제
      await Promise.all(logs.map((log) => travelApi.delete(token, log.id)));
    },
    onSuccess: (_, variables) => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: travelKeys.list(variables.token),
      });
    },
    onError: (error) => {
      console.error("여행 기록 일괄 삭제 실패:", error);
    },
  });
};
