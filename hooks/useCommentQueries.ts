import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentApi } from "@/lib/socialApi";
import { useAuthStore } from "@/stores/authStore";
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsResponse,
} from "@/types/social";

// 댓글 목록 조회
export const useComments = (
  travelLogId: string,
  page: number = 1,
  sort: string = "createdAt"
) => {
  const { token } = useAuthStore();

  return useQuery<GetCommentsResponse, Error>({
    queryKey: ["comments", travelLogId, page, sort],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return commentApi.getComments(token, travelLogId, page, 20, sort);
    },
    enabled: !!token && !!travelLogId,
    staleTime: 1000 * 30, // 30초 (댓글은 자주 업데이트됨)
  });
};

// 대댓글 목록 조회
export const useReplies = (commentId: string, page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery<GetCommentsResponse, Error>({
    queryKey: ["comments", "replies", commentId, page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return commentApi.getReplies(token, commentId, page);
    },
    enabled: !!token && !!commentId,
    staleTime: 1000 * 30, // 30초
  });
};

// 내가 작성한 댓글 목록
export const useMyComments = (page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery<GetCommentsResponse, Error>({
    queryKey: ["comments", "my-comments", page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return commentApi.getMyComments(token, page);
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1분
  });
};

// 댓글 작성
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<Comment, Error, CreateCommentRequest>({
    mutationFn: async (data) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return commentApi.createComment(token, data);
    },
    onSuccess: (data, variables) => {
      // 댓글 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.travelLogId],
      });

      // 부모 댓글의 대댓글 목록 갱신 (대댓글인 경우)
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: ["comments", "replies", variables.parentId],
        });
      }

      // 여행 기록의 commentCount 갱신
      queryClient.invalidateQueries({ queryKey: ["travel-feed"] });
      queryClient.invalidateQueries({ queryKey: ["travel-logs"] });
    },
  });
};

// 댓글 수정
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<
    Comment,
    Error,
    { commentId: string; data: UpdateCommentRequest; travelLogId: string }
  >({
    mutationFn: async ({ commentId, data }) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return commentApi.updateComment(token, commentId, data);
    },
    onSuccess: (data, variables) => {
      // 댓글 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.travelLogId],
      });
    },
  });
};

// 댓글 삭제
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<
    { message: string },
    Error,
    { commentId: string; travelLogId: string; parentId?: string }
  >({
    mutationFn: async ({ commentId }) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return commentApi.deleteComment(token, commentId);
    },
    onSuccess: (data, variables) => {
      // 댓글 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.travelLogId],
      });

      // 부모 댓글의 대댓글 목록 갱신 (대댓글인 경우)
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: ["comments", "replies", variables.parentId],
        });
      }

      // 여행 기록의 commentCount 갱신
      queryClient.invalidateQueries({ queryKey: ["travel-feed"] });
      queryClient.invalidateQueries({ queryKey: ["travel-logs"] });
    },
  });
};
