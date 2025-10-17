import type { TravelLog } from "./travel";

export interface TravelStory {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string | null;
  travelLogIds: string[]; // 포함된 여행 기록 ID들
  template: StoryTemplate;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StoryTemplate =
  | "timeline" // 시간순 타임라인
  | "map" // 지도 중심
  | "gallery" // 갤러리 그리드
  | "mood"; // 감정별 분류

export interface StoryWithLogs extends TravelStory {
  travelLogs: TravelLog[];
}

export interface TravelRoute {
  id: string;
  name: string;
  description: string;
  waypoints: RouteWaypoint[];
  totalDays: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  placeName: string;
  country: string;
  recommendedDays: number;
  highlights: string[];
  order: number;
}

export const storyTemplates = {
  timeline: {
    name: "타임라인",
    description: "시간순으로 여행 기록 정렬",
    icon: "📅",
  },
  map: {
    name: "지도",
    description: "지도 중심으로 여행지 표시",
    icon: "🗺️",
  },
  gallery: {
    name: "갤러리",
    description: "사진 중심 그리드 레이아웃",
    icon: "🖼️",
  },
  mood: {
    name: "감정",
    description: "감정별로 여행 분류",
    icon: "💭",
  },
} as const;
