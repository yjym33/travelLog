// 임시 Mock API - 백엔드 서버 문제 해결 전까지 사용
import type { LoginResponse, RegisterResponse } from "@/types/auth";

// Mock 사용자 데이터
const mockUsers = [
  {
    id: "1",
    email: "demo@travelog.com",
    nickname: "demo",
    password: "password123",
    profileImage: undefined,
  },
  {
    id: "2",
    email: "test@example.com",
    nickname: "testuser",
    password: "test123",
    profileImage: undefined,
  },
];

// Mock 로그인 함수
export const mockLogin = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  // 실제 API 호출 시뮬레이션을 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  // 비밀번호 제거 후 사용자 정보 반환
  const { password: _, ...userWithoutPassword } = user;

  return {
    accessToken: `mock_token_${user.id}_${Date.now()}`,
    user: userWithoutPassword,
  };
};

// Mock 회원가입 함수
export const mockRegister = async (
  email: string,
  password: string,
  username: string
): Promise<RegisterResponse> => {
  // 실제 API 호출 시뮬레이션을 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 이메일 중복 확인
  const existingUser = mockUsers.find((u) => u.email === email);
  if (existingUser) {
    throw new Error("이미 존재하는 이메일입니다.");
  }

  // 새 사용자 생성
  const newUser = {
    id: (mockUsers.length + 1).toString(),
    email,
    nickname: username, // username을 nickname으로 저장
    password,
    profileImage: undefined,
  };

  mockUsers.push(newUser);

  // 비밀번호 제거 후 사용자 정보 반환
  const { password: _, ...userWithoutPassword } = newUser;

  return {
    accessToken: `mock_token_${newUser.id}_${Date.now()}`,
    user: userWithoutPassword,
  };
};
