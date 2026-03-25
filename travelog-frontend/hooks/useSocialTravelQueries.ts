import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { socialTravelApi } from "@/lib/socialApi";
import { useAuthStore } from "@/stores/authStore";
import type {
  GetFeedResponse,
  TravelLogWithSocial,
  ShareVisibility,
  ShareType,
} from "@/types/social";

// 여행 기록 피드 (무한 스크롤)
export const useTravelFeed = () => {
  const { token } = useAuthStore();

  return useInfiniteQuery<GetFeedResponse, Error>({
    queryKey: ["travel-feed"],
    queryFn: async ({ pageParam = 1 }) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return socialTravelApi.getFeed(token, pageParam as number);
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1분
    initialPageParam: 1,
  });
};

// 특정 사용자의 여행 기록
export const useUserTravelLogs = (userId: string, page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery<GetFeedResponse, Error>({
    queryKey: ["travel-logs", "user", userId, page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return socialTravelApi.getUserTravelLogs(token, userId, page);
    },
    enabled: !!token && !!userId,
    staleTime: 1000 * 60 * 2, // 2분
  });
};

// 나와 공유된 여행 기록
export const useSharedTravelLogs = (page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["travel-logs", "shared", page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return socialTravelApi.getSharedWithMe(token, page);
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1분
  });
};

// 공개 범위 변경
export const useUpdateVisibility = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<
    TravelLogWithSocial,
    Error,
    { travelLogId: string; visibility: ShareVisibility }
  >({
    mutationFn: async ({ travelLogId, visibility }) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return socialTravelApi.updateVisibility(token, travelLogId, visibility);
    },
    onSuccess: (data) => {
      // 피드 갱신
      queryClient.invalidateQueries({ queryKey: ["travel-feed"] });
      queryClient.invalidateQueries({ queryKey: ["travelLogs"] });
      queryClient.invalidateQueries({
        queryKey: ["travel-logs", "user"],
      });
    },
  });
};

// 여행 기록 공유
export const useShareTravelLog = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<
    any,
    Error,
    {
      travelLogId: string;
      sharedWith?: string;
      message?: string;
      shareType: ShareType;
    }
  >({
    mutationFn: async ({ travelLogId, sharedWith, message, shareType }) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return socialTravelApi.shareTravelLog(token, travelLogId, {
        sharedWith,
        message,
        shareType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-logs", "shared"] });
    },
  });
};

// 조회수 증가
export const useIncrementViewCount = () => {
  const { token } = useAuthStore();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (travelLogId: string) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return socialTravelApi.incrementViewCount(token, travelLogId);
    },
    // 조회수는 UI에 즉시 반영하지 않으므로 invalidate 불필요
  });
};
