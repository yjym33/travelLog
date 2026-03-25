import type {
  Friendship,
  FriendRequest,
  UserWithFriendshipStatus,
  TravelLogWithSocial,
  TravelLogShare,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  GetFriendsResponse,
  GetFeedResponse,
  GetCommentsResponse,
  SearchUsersResponse,
  ShareVisibility,
  ShareType,
} from "@/types/social";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ============================================
// 친구 시스템 API
// ============================================

export const friendshipApi = {
  // 친구 요청 보내기
  sendRequest: async (
    token: string,
    addresseeId: string
  ): Promise<Friendship> => {
    const response = await fetch(`${API_BASE_URL}/api/friendships/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ addresseeId }),
    });

    if (!response.ok) {
      throw new Error("친구 요청 전송에 실패했습니다.");
    }

    return response.json();
  },

  // 친구 요청 수락
  acceptRequest: async (
    token: string,
    requestId: string
  ): Promise<Friendship> => {
    const response = await fetch(
      `${API_BASE_URL}/api/friendships/requests/${requestId}/accept`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("친구 요청 수락에 실패했습니다.");
    }

    return response.json();
  },

  // 친구 요청 거절
  rejectRequest: async (
    token: string,
    requestId: string
  ): Promise<Friendship> => {
    const response = await fetch(
      `${API_BASE_URL}/api/friendships/requests/${requestId}/reject`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("친구 요청 거절에 실패했습니다.");
    }

    return response.json();
  },

  // 친구 목록 조회
  getFriends: async (
    token: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetFriendsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);

    const response = await fetch(
      `${API_BASE_URL}/api/friendships?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("친구 목록 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 받은 친구 요청 목록
  getReceivedRequests: async (
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetFriendsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/friendships/requests/received?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("받은 친구 요청 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 보낸 친구 요청 목록
  getSentRequests: async (
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetFriendsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/friendships/requests/sent?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("보낸 친구 요청 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 친구 삭제
  removeFriend: async (
    token: string,
    friendshipId: string
  ): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/friendships/${friendshipId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("친구 삭제에 실패했습니다.");
    }

    return response.json();
  },

  // 사용자 검색
  searchUsers: async (
    token: string,
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchUsersResponse> => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/friendships/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("사용자 검색에 실패했습니다.");
    }

    return response.json();
  },
};

// ============================================
// 여행 기록 공유 API
// ============================================

export const socialTravelApi = {
  // 여행 기록 피드
  getFeed: async (
    token: string,
    page: number = 1,
    limit: number = 20,
    visibility?: ShareVisibility[]
  ): Promise<GetFeedResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/travel-logs/feed?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("피드 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 특정 사용자의 여행 기록
  getUserTravelLogs: async (
    token: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetFeedResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/travel-logs/user/${userId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("사용자 여행 기록 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 공개 범위 변경
  updateVisibility: async (
    token: string,
    travelLogId: string,
    visibility: ShareVisibility
  ): Promise<TravelLogWithSocial> => {
    const response = await fetch(
      `${API_BASE_URL}/api/travel-logs/${travelLogId}/visibility`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ visibility }),
      }
    );

    if (!response.ok) {
      throw new Error("공개 범위 변경에 실패했습니다.");
    }

    return response.json();
  },

  // 여행 기록 공유
  shareTravelLog: async (
    token: string,
    travelLogId: string,
    data: {
      sharedWith?: string;
      message?: string;
      shareType: ShareType;
    }
  ): Promise<TravelLogShare> => {
    const response = await fetch(
      `${API_BASE_URL}/api/travel-logs/${travelLogId}/share`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("여행 기록 공유에 실패했습니다.");
    }

    return response.json();
  },

  // 나와 공유된 여행 기록
  getSharedWithMe: async (
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/travel-logs/shared/received?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("공유된 여행 기록 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 조회수 증가
  incrementViewCount: async (
    token: string,
    travelLogId: string
  ): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/travel-logs/${travelLogId}/view`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("조회수 증가에 실패했습니다.");
    }

    return response.json();
  },
};

// ============================================
// 좋아요 API
// ============================================

export const likeApi = {
  // 여행 기록 좋아요 토글
  toggleTravelLogLike: async (
    token: string,
    travelLogId: string
  ): Promise<{ liked: boolean; message: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/likes/travel-log/${travelLogId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("좋아요 처리에 실패했습니다.");
    }

    return response.json();
  },

  // 댓글 좋아요 토글
  toggleCommentLike: async (
    token: string,
    commentId: string
  ): Promise<{ liked: boolean; message: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/likes/comment/${commentId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("댓글 좋아요 처리에 실패했습니다.");
    }

    return response.json();
  },

  // 여행 기록 좋아요 목록
  getTravelLogLikes: async (
    token: string,
    travelLogId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/likes/travel-log/${travelLogId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("좋아요 목록 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 내가 좋아요한 여행 기록
  getMyLikes: async (
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/likes/my-likes?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("내가 좋아요한 목록 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 좋아요 여부 확인
  checkIfLiked: async (
    token: string,
    travelLogId: string
  ): Promise<{ liked: boolean }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/likes/check/${travelLogId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("좋아요 여부 확인에 실패했습니다.");
    }

    return response.json();
  },
};

// ============================================
// 댓글 API
// ============================================

export const commentApi = {
  // 댓글 작성
  createComment: async (
    token: string,
    data: CreateCommentRequest
  ): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("댓글 작성에 실패했습니다.");
    }

    return response.json();
  },

  // 댓글 목록 조회
  getComments: async (
    token: string,
    travelLogId: string,
    page: number = 1,
    limit: number = 20,
    sort: string = "createdAt"
  ): Promise<GetCommentsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
    });

    const response = await fetch(
      `${API_BASE_URL}/api/comments/travel-log/${travelLogId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("댓글 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 대댓글 목록 조회
  getReplies: async (
    token: string,
    commentId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<GetCommentsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/comments/${commentId}/replies?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("대댓글 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 댓글 수정
  updateComment: async (
    token: string,
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("댓글 수정에 실패했습니다.");
    }

    return response.json();
  },

  // 댓글 삭제
  deleteComment: async (
    token: string,
    commentId: string
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("댓글 삭제에 실패했습니다.");
    }

    return response.json();
  },

  // 내가 작성한 댓글 목록
  getMyComments: async (
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetCommentsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/comments/my-comments?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("내 댓글 조회에 실패했습니다.");
    }

    return response.json();
  },
};
