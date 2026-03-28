import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth";
import type {
  TravelLog,
  CreateTravelRequest,
  UpdateTravelRequest,
  FilterTravelRequest,
  TravelStatistics,
  TravelResponse,
} from "@/types/travel";
import { mockLogin, mockRegister } from "./mockApi";

// Re-export types for external use
export type { CreateTravelRequest, UpdateTravelRequest };

// AI 분석 관련 타입 정의
export interface AnalyzeImageRequest {
  imageUrl: string;
}

export interface AnalyzeImageResponse {
  success: boolean;
  tags: string[];
  confidence: number;
  message?: string;
}

export interface AnalyzeEmotionRequest {
  text: string;
}

export interface AnalyzeEmotionResponse {
  success: boolean;
  emotion: string;
  confidence: number;
  keywords: string[];
  message?: string;
}

export interface GenerateDescriptionResponse {
  success: boolean;
  description: string;
  message?: string;
}

export interface GenerateStoryResponse {
  success: boolean;
  story: string;
  message?: string;
}

export interface Recommendation {
  name: string;
  lat: number;
  lng: number;
  reason: string;
  tags: string[];
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: Recommendation[];
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log("API Request:", {
        url,
        method: config.method,
        headers: config.headers,
        body: config.body instanceof FormData ? "FormData" : config.body,
      });

      const response = await fetch(url, {
        ...config,
        mode: "cors",
        credentials: "include",
      });

      console.log("API Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        let errorData = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (e) {
          console.warn("Could not parse error response as JSON");
        }

        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          url,
          errorData,
        });

        // CORS 관련 오류 처리
        if (response.status === 0 || response.status === undefined) {
          throw new Error(
            "CORS 오류가 발생했습니다. 브라우저의 CORS 정책을 확인해주세요."
          );
        }

        // NestJS 에러 응답 처리
        const errorMessage = (errorData as any)?.message
          ? Array.isArray((errorData as any).message)
            ? (errorData as any).message[0]
            : (errorData as any).message
          : `HTTP error! status: ${response.status}`;

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("Network Error:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요."
        );
      }
      if (error instanceof Error && error.message.includes("CORS")) {
        throw new Error(
          "CORS 오류가 발생했습니다. 브라우저의 CORS 정책을 확인해주세요."
        );
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("네트워크 오류가 발생했습니다.");
    }
  }

  // 인증 관련 API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      return await this.request<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    } catch (error) {
      console.warn("백엔드 API 연결 실패, Mock API 사용:", error);
      return await mockLogin(credentials.email, credentials.password);
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      return await this.request<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.warn("백엔드 API 연결 실패, Mock API 사용:", error);
      return await mockRegister(
        userData.email,
        userData.password,
        userData.username
      );
    }
  }

  // 토큰을 사용한 인증된 요청
  async authenticatedRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);

// 편의 함수들
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.login({ email, password }),

  register: (email: string, password: string, username: string) =>
    apiClient.register({ email, password, username }),
};

// 여행 기록 관련 API
export const travelApi = {
  // 여행 기록 생성
  create: (token: string, data: CreateTravelRequest): Promise<TravelResponse> =>
    apiClient.authenticatedRequest<TravelResponse>("/api/travels", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // 여행 기록 목록 조회 (필터링 포함)
  getList: (
    token: string,
    filters?: FilterTravelRequest
  ): Promise<TravelResponse[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/travels?${queryString}`
      : "/api/travels";
    return apiClient.authenticatedRequest<TravelResponse[]>(endpoint, token);
  },

  // 여행 기록 상세 조회
  getOne: (token: string, id: string): Promise<TravelResponse> =>
    apiClient.authenticatedRequest<TravelResponse>(`/api/travels/${id}`, token),

  // 여행 기록 수정
  update: (
    token: string,
    id: string,
    data: UpdateTravelRequest
  ): Promise<TravelResponse> =>
    apiClient.authenticatedRequest<TravelResponse>(
      `/api/travels/${id}`,
      token,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  // 여행 기록 삭제
  delete: (token: string, id: string): Promise<{ message: string }> =>
    apiClient.authenticatedRequest<{ message: string }>(
      `/api/travels/${id}`,
      token,
      {
        method: "DELETE",
      }
    ),

  // 여행 통계 조회
  getStatistics: (token: string): Promise<TravelStatistics> =>
    apiClient.authenticatedRequest<TravelStatistics>(
      "/api/travels/statistics",
      token
    ),
};

// 파일 업로드 관련 API
export const uploadApi = {
  // 단일 이미지 업로드
  uploadSingle: async (
    token: string,
    file: File
  ): Promise<{ success: boolean; url: string }> => {
    if (!token) {
      console.error("Upload failed: No auth token provided");
      throw new Error("로그인 상태를 확인해주세요.");
    }

    const formData = new FormData();
    formData.append("file", file);

    console.log(`[API] Uploading file: ${file.name} (${file.size} bytes)`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/single`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        mode: "cors",
        credentials: "include",
      });

      console.log(`[API] Upload response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Upload failed details:`, errorText);
        throw new Error(
          `업로드 실패: 서버에서 ${response.status} 오류가 발생했습니다.`
        );
      }

      const result = await response.json();
      console.log("[API] Upload successful:", result);
      return result;
    } catch (error) {
      console.error("[API] Upload exception:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "서버 연결 실패: 백엔드 서버가 실행 중인지, URL(http://localhost:8080)이 올바른지 확인해주세요."
        );
      }
      throw error;
    }
  },

  // 여러 이미지 업로드
  uploadMultiple: (
    token: string,
    files: File[]
  ): Promise<{ success: boolean; urls: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    return apiClient.authenticatedRequest<{ success: boolean; urls: string[] }>(
      "/api/upload/multiple",
      token,
      {
        method: "POST",
        headers: {}, // FormData는 Content-Type을 자동으로 설정
        body: formData,
      }
    );
  },
};

// AI 분석 관련 API
export const aiApi = {
  // 이미지 분석을 통한 자동 태그 생성
  analyzeImage: (
    token: string,
    imageUrl: string
  ): Promise<AnalyzeImageResponse> =>
    apiClient.authenticatedRequest<AnalyzeImageResponse>(
      "/api/ai/analyze-image",
      token,
      {
        method: "POST",
        body: JSON.stringify({ imageUrl }),
      }
    ),

  // 일기 텍스트 감정 분석 (DEPRECATED)
  analyzeEmotion: (
    token: string,
    text: string
  ): Promise<AnalyzeEmotionResponse> =>
    apiClient.authenticatedRequest<AnalyzeEmotionResponse>(
      "/api/ai/analyze-emotion",
      token,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      }
    ),

  // 사진을 통한 AI 설명 생성
  generateDescription: (
    token: string,
    imageUrls: string[]
  ): Promise<GenerateDescriptionResponse> =>
    apiClient.authenticatedRequest<GenerateDescriptionResponse>(
      "/api/ai/generate-description",
      token,
      {
        method: "POST",
        body: JSON.stringify({ imageUrls }),
      }
    ),

  // 사진과 장소를 통한 AI 일기 생성
  generateDiary: (
    token: string,
    imageUrls: string[],
    placeName: string
  ): Promise<GenerateStoryResponse> =>
    apiClient.authenticatedRequest<GenerateStoryResponse>(
      "/api/ai/generate-diary",
      token,
      {
        method: "POST",
        body: JSON.stringify({ imageUrls, placeName }),
      }
    ),

  // 지도 기반 여행지 추천 받기
  getRecommendations: (
    token: string,
    lat: number,
    lng: number,
    isGlobal: boolean = false
  ): Promise<RecommendationResponse> => {
    const query = isGlobal ? "isGlobal=true" : `lat=${lat}&lng=${lng}`;
    return apiClient.authenticatedRequest<RecommendationResponse>(
      `/api/ai/recommendations?${query}`,
      token
    );
  },
};
