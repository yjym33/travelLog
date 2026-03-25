import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ViewMode = "map" | "gallery" | "timeline" | "stats" | "globe" | "social";
type ModalType = "travel" | "share" | "storyCreator" | null;

interface FilterState {
  emotions: string[];
  dateRange: { start: string | null; end: string | null };
  tags: string[];
  countries: string[];
  searchQuery: string;
}

const initialFilterState: FilterState = {
  emotions: [],
  dateRange: { start: null, end: null },
  tags: [],
  countries: [],
  searchQuery: "",
};

interface UIState {
  // View
  viewMode: ViewMode;

  // Modals
  isModalOpen: boolean;
  activeModal: ModalType;

  // Sidebar
  isSidebarOpen: boolean;
  sidebarWidth: number;

  // Filter Panel
  isFilterPanelOpen: boolean;
  filters: FilterState;

  // Global Loading
  isGlobalLoading: boolean;
  loadingMessage: string;

  // Global Error
  globalError: string | null;

  // Theme
  theme: "light" | "dark" | "system";

  // Animations
  animationsEnabled: boolean;

  // Slideshow
  selectedPhotoIndex: number;
  isSlideshowOpen: boolean;

  // Story Playback
  isStoryPlaying: boolean;
  storyPlaybackSpeed: number;
}

interface UIActions {
  // View Actions
  setViewMode: (mode: ViewMode) => void;

  // Modal Actions
  openModal: (type?: ModalType) => void;
  closeModal: () => void;
  toggleModal: (type?: ModalType) => void;

  // Sidebar Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;

  // Filter Panel Actions
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Global Loading Actions
  setGlobalLoading: (isLoading: boolean, message?: string) => void;
  clearLoading: () => void;

  // Global Error Actions
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;

  // Theme Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;

  // Animation Actions
  setAnimationsEnabled: (enabled: boolean) => void;
  toggleAnimations: () => void;

  // Slideshow Actions
  setSelectedPhotoIndex: (index: number) => void;
  setSlideshowOpen: (open: boolean) => void;

  // Story Playback Actions
  setStoryPlaying: (playing: boolean) => void;
  setStoryPlaybackSpeed: (speed: number) => void;

  // Reset All UI
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  viewMode: "map",
  isModalOpen: false,
  activeModal: null,
  isSidebarOpen: true,
  sidebarWidth: 300,
  isFilterPanelOpen: false,
  filters: initialFilterState,
  isGlobalLoading: false,
  loadingMessage: "",
  globalError: null,
  theme: "system",
  animationsEnabled: true,
  selectedPhotoIndex: 0,
  isSlideshowOpen: false,
  isStoryPlaying: false,
  storyPlaybackSpeed: 1,
};

export const useUIStore = create<UIStore>()(
  devtools((set, get) => ({
    ...initialState,

    // View Actions
    setViewMode: (mode) => set({ viewMode: mode }),

    // Modal Actions
    openModal: (type = "travel") =>
      set({ isModalOpen: true, activeModal: type }),
    closeModal: () => set({ isModalOpen: false, activeModal: null }),
    toggleModal: (type = "travel") =>
      set((state) => ({
        isModalOpen: !state.isModalOpen,
        activeModal: state.isModalOpen ? null : type,
      })),

    // Sidebar Actions
    toggleSidebar: () =>
      set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    setSidebarWidth: (width) => set({ sidebarWidth: width }),

    // Filter Panel Actions
    toggleFilterPanel: () =>
      set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
    setFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),
    setFilters: (newFilters) =>
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),
    resetFilters: () => set({ filters: initialFilterState }),

    // Global Loading Actions
    setGlobalLoading: (isLoading, message = "") =>
      set({ isGlobalLoading: isLoading, loadingMessage: message }),
    clearLoading: () => set({ isGlobalLoading: false, loadingMessage: "" }),

    // Global Error Actions
    setGlobalError: (error) => set({ globalError: error }),
    clearGlobalError: () => set({ globalError: null }),

    // Theme Actions
    setTheme: (theme) => set({ theme }),
    toggleTheme: () =>
      set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

    // Animation Actions
    setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
    toggleAnimations: () =>
      set((state) => ({ animationsEnabled: !state.animationsEnabled })),

    // Slideshow Actions
    setSelectedPhotoIndex: (index) => set({ selectedPhotoIndex: index }),
    setSlideshowOpen: (open) => set({ isSlideshowOpen: open }),

    // Story Playback Actions
    setStoryPlaying: (playing) => set({ isStoryPlaying: playing }),
    setStoryPlaybackSpeed: (speed) =>
      set({ storyPlaybackSpeed: Math.max(0.5, Math.min(3, speed)) }),

    // Reset All UI
    resetUI: () => set(initialState),
  }))
);

// 편의를 위한 커스텀 훅들
export const useCurrentView = () => useUIStore();
export const useModal = () => useUIStore();
export const useSidebar = () => useUIStore();
export const useFilterPanel = () => useUIStore();
export const useGlobalLoading = () => useUIStore();
export const useGlobalError = () => useUIStore();
export const useTheme = () => useUIStore();
export const useAnimations = () => useUIStore();
export const useSlideshow = () => useUIStore();
export const useStoryPlayback = () => useUIStore();
