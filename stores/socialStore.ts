import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "@/types/auth";
import type { Comment, TravelLogWithSocial } from "@/types/social";

interface SocialState {
  // 친구 관련
  selectedFriend: User | null;
  friendSearchQuery: string;
  isFriendModalOpen: boolean;

  // 피드 관련
  selectedFeedLog: TravelLogWithSocial | null;
  isFeedDetailOpen: boolean;

  // 댓글 관련
  replyingTo: Comment | null;
  editingComment: Comment | null;
  commentInputValue: string;

  // 공유 관련
  isSharingLog: TravelLogWithSocial | null;
  isShareModalOpen: boolean;

  // 좋아요 목록 모달
  isLikeListOpen: boolean;
  likeListTravelLogId: string | null;

  // 알림 관련
  unreadNotificationCount: number;
  isNotificationPanelOpen: boolean;
}

interface SocialActions {
  // 친구 관련
  selectFriend: (friend: User | null) => void;
  setFriendSearchQuery: (query: string) => void;
  openFriendModal: () => void;
  closeFriendModal: () => void;

  // 피드 관련
  selectFeedLog: (log: TravelLogWithSocial | null) => void;
  openFeedDetail: (log: TravelLogWithSocial) => void;
  closeFeedDetail: () => void;

  // 댓글 관련
  setReplyingTo: (comment: Comment | null) => void;
  setEditingComment: (comment: Comment | null) => void;
  setCommentInputValue: (value: string) => void;
  clearCommentState: () => void;

  // 공유 관련
  openShareModal: (log: TravelLogWithSocial) => void;
  closeShareModal: () => void;

  // 좋아요 목록
  openLikeList: (travelLogId: string) => void;
  closeLikeList: () => void;

  // 알림 관련
  setUnreadNotificationCount: (count: number) => void;
  incrementUnreadNotificationCount: () => void;
  decrementUnreadNotificationCount: () => void;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;

  // 전체 리셋
  resetSocial: () => void;
}

type SocialStore = SocialState & SocialActions;

const initialState: SocialState = {
  // 친구
  selectedFriend: null,
  friendSearchQuery: "",
  isFriendModalOpen: false,

  // 피드
  selectedFeedLog: null,
  isFeedDetailOpen: false,

  // 댓글
  replyingTo: null,
  editingComment: null,
  commentInputValue: "",

  // 공유
  isSharingLog: null,
  isShareModalOpen: false,

  // 좋아요
  isLikeListOpen: false,
  likeListTravelLogId: null,

  // 알림
  unreadNotificationCount: 0,
  isNotificationPanelOpen: false,
};

export const useSocialStore = create<SocialStore>()(
  devtools((set) => ({
    ...initialState,

    // 친구 관련
    selectFriend: (friend) => set({ selectedFriend: friend }),
    setFriendSearchQuery: (query) => set({ friendSearchQuery: query }),
    openFriendModal: () => set({ isFriendModalOpen: true }),
    closeFriendModal: () =>
      set({ isFriendModalOpen: false, friendSearchQuery: "" }),

    // 피드 관련
    selectFeedLog: (log) => set({ selectedFeedLog: log }),
    openFeedDetail: (log) =>
      set({ selectedFeedLog: log, isFeedDetailOpen: true }),
    closeFeedDetail: () =>
      set({ selectedFeedLog: null, isFeedDetailOpen: false }),

    // 댓글 관련
    setReplyingTo: (comment) => set({ replyingTo: comment }),
    setEditingComment: (comment) => set({ editingComment: comment }),
    setCommentInputValue: (value) => set({ commentInputValue: value }),
    clearCommentState: () =>
      set({
        replyingTo: null,
        editingComment: null,
        commentInputValue: "",
      }),

    // 공유 관련
    openShareModal: (log) => set({ isSharingLog: log, isShareModalOpen: true }),
    closeShareModal: () => set({ isSharingLog: null, isShareModalOpen: false }),

    // 좋아요 목록
    openLikeList: (travelLogId) =>
      set({ isLikeListOpen: true, likeListTravelLogId: travelLogId }),
    closeLikeList: () =>
      set({ isLikeListOpen: false, likeListTravelLogId: null }),

    // 알림 관련
    setUnreadNotificationCount: (count) =>
      set({ unreadNotificationCount: count }),
    incrementUnreadNotificationCount: () =>
      set((state) => ({
        unreadNotificationCount: state.unreadNotificationCount + 1,
      })),
    decrementUnreadNotificationCount: () =>
      set((state) => ({
        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
      })),
    toggleNotificationPanel: () =>
      set((state) => ({
        isNotificationPanelOpen: !state.isNotificationPanelOpen,
      })),
    closeNotificationPanel: () => set({ isNotificationPanelOpen: false }),

    // 전체 리셋
    resetSocial: () => set(initialState),
  }))
);

// 편의를 위한 커스텀 훅들
export const useSelectedFriend = () => useSocialStore();
export const useFriendModal = () => useSocialStore();
export const useFeedDetail = () => useSocialStore();
export const useCommentState = () => useSocialStore();
export const useShareModal = () => useSocialStore();
export const useLikeList = () => useSocialStore();
export const useNotifications = () => useSocialStore();
