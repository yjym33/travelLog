import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth";
import { mockLogin, mockRegister } from "./mockApi";

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
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          url,
          errorData,
        });

        // NestJS 에러 응답 처리
        const errorMessage = errorData.message
          ? Array.isArray(errorData.message)
            ? errorData.message[0]
            : errorData.message
          : `HTTP error! status: ${response.status}`;

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("Network Error:", error);
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
