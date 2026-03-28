// 여행 기록 관련 타입 정의

export interface TravelLog {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  placeName: string;
  country: string;
  emotion?: string; // 감성 기능 제외에 따른 선택사항 변경
  photos: string[];
  diary: string;
  aiDescription?: string; // AI가 생성한 사진 설명
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTravelRequest {
  lat: number;
  lng: number;
  placeName: string;
  country: string;
  emotion?: string;
  photos: string[];
  diary: string;
  aiDescription?: string;
  tags: string[];
}

export interface UpdateTravelRequest {
  placeName?: string;
  country?: string;
  emotion?: string;
  photos?: string[];
  diary?: string;
  aiDescription?: string;
  tags?: string[];
}

export interface FilterTravelRequest {
  emotions?: string[]; // Legacy
  countries?: string[];
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export interface TravelStatistics {
  totalLogs: number;
  uniqueCountries: number;
  countries: string[];
  // emotionDistribution은 레거시
  emotionDistribution?: Record<string, number>;
  countryDistribution: Record<string, number>;
  monthlyTravels: Record<string, number>;
}

export interface TravelResponse {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  placeName: string;
  country: string;
  emotion: string;
  photos: string[];
  diary: string;
  aiDescription?: string; // AI가 생성한 사진 설명 추가
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 감정 타입 정의
export type EmotionType =
  | "happy"
  | "peaceful"
  | "excited"
  | "nostalgic"
  | "romantic"
  | "adventurous"
  | "grateful"
  | "inspired";

// 감정 정보 객체 타입
export interface Emotion {
  color: string;
  emoji: string;
  label: string;
}

// 감정 정보
export const emotions: Record<EmotionType, Emotion> = {
  happy: { color: "#FFD700", emoji: "😊", label: "행복" },
  peaceful: { color: "#87CEEB", emoji: "😌", label: "평온" },
  excited: { color: "#FF6B6B", emoji: "🤩", label: "신남" },
  nostalgic: { color: "#DDA0DD", emoji: "🥺", label: "그리움" },
  romantic: { color: "#FF69B4", emoji: "🥰", label: "로맨틱" },
  adventurous: { color: "#32CD32", emoji: "🏔️", label: "모험" },
  grateful: { color: "#FFA500", emoji: "🙏", label: "감사" },
  inspired: { color: "#9370DB", emoji: "✨", label: "영감" },
};
