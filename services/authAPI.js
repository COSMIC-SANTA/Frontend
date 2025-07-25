// API 기본 설정
const API_BASE_URL = "http://localhost:8081/api/auth/sign-up"; // 백엔드 서버 주소에 맞게 수정하세요

// 로그인 API 함수
export const loginAPI = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Login API Error:", error);
    return {
      success: false,
      error: error.message || "네트워크 오류가 발생했습니다.",
    };
  }
};

// 사용자 정보 가져오기 API (선택사항)
export const getUserInfo = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Get User Info API Error:", error);
    return {
      success: false,
      error: error.message || "사용자 정보를 가져올 수 없습니다.",
    };
  }
};

// API 응답 타입 예시 (참고용)
/*
로그인 성공 응답 예시:
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "test@test.com",
      "name": "홍길동"
    }
  }
}

로그인 실패 응답 예시:
{
  "success": false,
  "message": "이메일 또는 비밀번호가 잘못되었습니다.",
  "error": "INVALID_CREDENTIALS"
}
*/
