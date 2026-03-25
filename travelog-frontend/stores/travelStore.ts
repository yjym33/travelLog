import { create } from "zustand";
import type { TravelLog } from "@/types/travel";

// 여행 기록 클라이언트 상태 타입 정의
interface TravelState {
  // 선택된 여행 기록
  selectedLog: TravelLog | null;
}

// 여행 기록 액션 타입 정의
interface TravelActions {
  // 여행 기록 선택
  selectLog: (log: TravelLog | null) => void;
}

// 전체 여행 스토어 타입
type TravelStore = TravelState & TravelActions;

// 여행 스토어 생성 (클라이언트 상태만 관리)
export const useTravelStore = create<TravelStore>()((set) => ({
  // 초기 상태
  selectedLog: null,

  // 여행 기록 선택
  selectLog: (log) => set({ selectedLog: log }),
}));
