import type { User } from "./auth";
import type { TravelLog } from "./travel";

// ============================================
// 친구 시스템
// ============================================

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  requester: User;
  addressee: User;
}

export interface FriendRequest {
  id: string;
  requester: User;
  addressee: User;
  status: FriendshipStatus;
  createdAt: string;
}

export interface UserWithFriendshipStatus extends User {
  friendshipStatus: FriendshipStatus | null;
  friendshipId: string | null;
  isRequester: boolean;
}

// ============================================
// 여행 기록 공유
// ============================================

export type ShareVisibility = "PRIVATE" | "FRIENDS" | "PUBLIC";
export type ShareType = "LINK" | "DIRECT";

export interface TravelLogWithSocial extends TravelLog {
  visibility: ShareVisibility;
  allowComments: boolean;
  allowLikes: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLikedByMe?: boolean;
  user: User;
}

export interface TravelLogShare {
  id: string;
  travelLogId: string;
  userId: string;
  sharedWith?: string;
  shareType: ShareType;
  message?: string;
  createdAt: string;
  expiresAt?: string;
  user: User;
  travelLog: TravelLogWithSocial;
}

// ============================================
// 댓글 시스템
// ============================================

export interface Comment {
  id: string;
  travelLogId: string;
  userId: string;
  parentId?: string;
  content: string;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  replies?: Comment[];
  isLikedByMe?: boolean;
}

export interface CreateCommentRequest {
  travelLogId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// ============================================
// 좋아요 시스템
// ============================================

export interface Like {
  id: string;
  userId: string;
  createdAt: string;
  user: User;
}

export interface TravelLogLike extends Like {
  travelLogId: string;
}

export interface CommentLike extends Like {
  commentId: string;
}

// ============================================
// 알림 시스템
// ============================================

export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "TRAVEL_LOG_LIKED"
  | "TRAVEL_LOG_COMMENTED"
  | "COMMENT_REPLIED"
  | "COMMENT_LIKED"
  | "TRAVEL_LOG_SHARED";

export interface Notification {
  id: string;
  userId: string;
  actorId?: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actor?: User;
}

// ============================================
// API Response 타입
// ============================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// 친구 관련
export type GetFriendsResponse = PaginatedResponse<Friendship>;
export type GetFriendRequestsResponse = PaginatedResponse<FriendRequest>;
export type SearchUsersResponse = PaginatedResponse<UserWithFriendshipStatus>;

// 여행 기록 관련
export type GetFeedResponse = PaginatedResponse<TravelLogWithSocial>;
export type GetUserTravelLogsResponse = PaginatedResponse<TravelLogWithSocial>;
export type GetSharedTravelLogsResponse = PaginatedResponse<TravelLogShare>;

// 댓글 관련
export type GetCommentsResponse = PaginatedResponse<Comment>;

// 좋아요 관련
export type GetLikesResponse = PaginatedResponse<Like>;
export type GetMyLikesResponse = PaginatedResponse<{
  id: string;
  userId: string;
  travelLogId: string;
  createdAt: string;
  travelLog: TravelLogWithSocial;
}>;

// 알림 관련
export type GetNotificationsResponse = PaginatedResponse<Notification>;
