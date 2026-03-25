import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendshipApi } from "@/lib/socialApi";
import { useAuthStore } from "@/stores/authStore";
import type {
  Friendship,
  GetFriendsResponse,
  SearchUsersResponse,
} from "@/types/social";

// 친구 목록 조회
export const useFriendships = (status?: string, page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery<GetFriendsResponse, Error>({
    queryKey: ["friendships", status, page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.getFriends(token, status, page);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 받은 친구 요청 목록
export const useReceivedFriendRequests = (page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery<GetFriendsResponse, Error>({
    queryKey: ["friend-requests", "received", page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.getReceivedRequests(token, page);
    },
    enabled: !!token,
    staleTime: 1000 * 30, // 30초 (자주 업데이트)
  });
};

// 보낸 친구 요청 목록
export const useSentFriendRequests = (page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery<GetFriendsResponse, Error>({
    queryKey: ["friend-requests", "sent", page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.getSentRequests(token, page);
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1분
  });
};

// 사용자 검색
export const useSearchUsers = (query: string, page: number = 1) => {
  const { token } = useAuthStore();

  return useQuery<SearchUsersResponse, Error>({
    queryKey: ["users", "search", query, page],
    queryFn: async () => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.searchUsers(token, query, page);
    },
    enabled: !!token && query.length > 0,
    staleTime: 1000 * 60 * 2, // 2분
  });
};

// 친구 요청 보내기
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<Friendship, Error, string>({
    mutationFn: async (addresseeId: string) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.sendRequest(token, addresseeId);
    },
    onSuccess: () => {
      // 친구 요청 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["users", "search"] });
    },
  });
};

// 친구 요청 수락
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<Friendship, Error, string>({
    mutationFn: async (requestId: string) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.acceptRequest(token, requestId);
    },
    onSuccess: () => {
      // 모든 친구 관련 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["travel-feed"] });
    },
  });
};

// 친구 요청 거절
export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<Friendship, Error, string>({
    mutationFn: async (requestId: string) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.rejectRequest(token, requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
};

// 친구 삭제
export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (friendshipId: string) => {
      if (!token) throw new Error("인증 토큰이 없습니다.");
      return friendshipApi.removeFriend(token, friendshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
      queryClient.invalidateQueries({ queryKey: ["travel-feed"] });
    },
  });
};
