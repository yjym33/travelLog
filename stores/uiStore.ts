import { create } from "zustand";
import type { FilterState } from "@/types/filter";
import { initialFilterState } from "@/types/filter";

// UI 상태 타입 정의
interface UIState {
  // 뷰 모드
  viewMode: "map" | "gallery" | "timeline" | "stats" | "globe";

  // 모달 상태
  isModalOpen: boolean;
  isShareModalOpen: boolean;
  isStoryCreatorOpen: boolean;

  // 필터 패널
  isFilterPanelOpen: boolean;

  // 필터 상태
  filters: FilterState;

  // 로딩 상태
  isGlobalLoading: boolean;
  loadingMessage: string;
}

// UI 액션 타입 정의
interface UIActions {
  // 뷰 모드 변경
  setViewMode: (mode: UIState["viewMode"]) => void;

  // 모달 제어
  openModal: () => void;
  closeModal: () => void;
  openShareModal: () => void;
  closeShareModal: () => void;
  openStoryCreator: () => void;
  closeStoryCreator: () => void;

  // 필터 패널 제어
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;

  // 필터 상태 관리
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;

  // 전역 로딩 상태
  setGlobalLoading: (loading: boolean, message?: string) => void;
  clearLoading: () => void;
}

// 전체 UI 스토어 타입
type UIStore = UIState & UIActions;

// UI 스토어 생성
export const useUIStore = create<UIStore>()((set) => ({
  // 초기 상태
  viewMode: "map",
  isModalOpen: false,
  isShareModalOpen: false,
  isStoryCreatorOpen: false,
  isFilterPanelOpen: false,
  filters: initialFilterState,
  isGlobalLoading: false,
  loadingMessage: "",

  // 뷰 모드 변경
  setViewMode: (mode) => set({ viewMode: mode }),

  // 모달 제어
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  openShareModal: () => set({ isShareModalOpen: true }),
  closeShareModal: () => set({ isShareModalOpen: false }),
  openStoryCreator: () => set({ isStoryCreatorOpen: true }),
  closeStoryCreator: () => set({ isStoryCreatorOpen: false }),

  // 필터 패널 제어
  toggleFilterPanel: () =>
    set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
  setFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),

  // 필터 상태 관리
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: initialFilterState }),

  // 전역 로딩 상태
  setGlobalLoading: (loading, message = "") =>
    set({ isGlobalLoading: loading, loadingMessage: message }),
  clearLoading: () => set({ isGlobalLoading: false, loadingMessage: "" }),
}));
