import {
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { likeApi } from "@/lib/socialApi";
import { useAuthStore } from "@/stores/authStore";
import type { GetFeedResponse } from "@/types/social";

type TravelFeedCache = InfiniteData<GetFeedResponse>;

// 여행 기록 좋아요 토글 (Optimistic Update)
export const useToggleTravelLogLike = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<
    { liked: boolean; message: string },
    Error,
    { travelLogId: string; currentLiked: boolean },
    { previousFeed: TravelFeedCache | undefined }
  >({
    mutationFn: async ({ travelLogId }) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return likeApi.toggleTravelLogLike(token, travelLogId);
    },
    // Optimistic update
    onMutate: async ({ travelLogId, currentLiked }) => {
      // 기존 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["travel-feed"] });

      // 이전 데이터 백업
      const previousFeed = queryClient.getQueryData<TravelFeedCache>(["travel-feed"]);

      // Optimistic update
      queryClient.setQueryData<TravelFeedCache>(["travel-feed"], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((log) =>
              log.id === travelLogId
                ? {
                    ...log,
                    isLikedByMe: !currentLiked,
                    likeCount: currentLiked
                      ? log.likeCount - 1
                      : log.likeCount + 1,
                  }
                : log
            ),
          })),
        };
      });

      return { previousFeed };
    },
    // 에러 발생 시 롤백
    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["travel-feed"], context.previousFeed);
      }
    },
    // 성공 또는 에러 후 갱신
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-feed"] });
      queryClient.invalidateQueries({ queryKey: ["travel-logs"] });
    },
  });
};

// 댓글 좋아요 토글
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<
    { liked: boolean; message: string },
    Error,
    { commentId: string; travelLogId: string }
  >({
    mutationFn: async ({ commentId }) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return likeApi.toggleCommentLike(token, commentId);
    },
    onSuccess: (data, variables) => {
      // 댓글 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.travelLogId],
      });
    },
  });
};

// 여행 기록 좋아요 목록
export const useTravelLogLikes = (travelLogId: string, page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["likes", "travel-log", travelLogId, page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return likeApi.getTravelLogLikes(token, travelLogId, page);
    },
    enabled: !!token && !!travelLogId,
    staleTime: 1000 * 60, // 1분
  });
};

// 내가 좋아요한 여행 기록 목록
export const useMyLikes = (page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["likes", "my-likes", page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return likeApi.getMyLikes(token, page);
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1분
  });
};

// 좋아요 여부 확인
export const useCheckIfLiked = (travelLogId: string) => {
  const { token } = useAuthStore();

  return useQuery<{ liked: boolean }, Error>({
    queryKey: ["likes", "check", travelLogId],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return likeApi.checkIfLiked(token, travelLogId);
    },
    enabled: !!token && !!travelLogId,
    staleTime: 1000 * 30, // 30초
  });
};
