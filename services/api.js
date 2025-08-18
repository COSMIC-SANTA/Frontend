// services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 응답 인터셉터: 항상 { message, data } 형태로 반환
apiClient.interceptors.response.use(
  (res) => {
    // res.data = { message, data: {...} }
    return {
      message: res.data?.message ?? null,
      data: res.data?.data ?? null,
    };
  },
  (err) => Promise.reject(err)
);

export const mountainService = {
  fetchByInterest: async (interest, { signal } = {}) => {
    const res = await apiClient.get("/api/main/banner", {
      params: { type: "interest", interest },
      signal,
    });

    // res = { message, data: { interest, mountains } }
    const list = res?.data?.mountains ?? [];
    return list.map((m) => ({
      id: String(m.id),
      name: m.name,
      image: m.imageUrl || null,
    }));
  },
};

export const loginService = {
  login: async (username, password) => {
    try {
      const requestData = {
        username: username.trim(),
        password: password.trim(),
      };

    const response = await apiClient.post("/api/auth/login", requestData);
    console.log("로그인 응답 성공", response);

    return {
      success: true,
      data: response.data,
      message: response.message,
    };
    } catch (error) {
      console.log("login error:", error);
        let errorMessage = "로그인에 실패했습니다.";

if (error.response) {
        // 서버가 응답을 반환했지만 에러 상태코드
        const { status, data } = error.response;
        console.log(`HTTP ${status} 에러:`, data);

        let errorMessage = "로그인에 실패했습니다.";

        // 기존 코드와 동일한 에러 메시지 처리
        if (status === 401) {
          errorMessage = "사용자명 또는 비밀번호가 올바르지 않습니다.";
        } else if (status === 403) {
          errorMessage = "계정이 비활성화되었습니다.";
        } else if (status === 404) {
          errorMessage = "존재하지 않는 계정입니다.";
        } else if (status === 500) {
          errorMessage = "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }

        // 서버에서 보낸 메시지가 있으면 우선 사용
        if (data?.message) {
          errorMessage = data.message;
        }

        return {
          success: false,
          error: errorMessage,
          status: status,
        };
      } else if (error.request) {
        console.log("Network error:", error.message);

        let errorMessage = "네트워크 연결 문제 발생";

        if (error.message.includes("Network Error") || error.message.includes("timeout")) {
          errorMessage = "서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인요망";
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
        }

        return {
          success: false,
          error: errorMessage,
        };
      } else {
        console.log("요청 설정 에러:", error.message);
        return {
          success: false,
          error: "요청 처리 중 오류가 발생했습니다",
        };
      }
    }
  },
};

// 여행 목록 소개

export const tourismService = {
    getTouristSpots: async (location, pageNo = 1, {signal} = {}) => {
      try {
        const response = await apiClient.get(`/api/mountains/${location}/${pageNo}`, {
          signal,
        });
      console.log(`${location} 관광지 정보 (페이지 ${pageNo})`, response);
      return {
        success: true,
        data: response.data,
        message: response.message,
        currentPage: pageNo,
      };
    } catch (error) {
      console.log("관광지 정보 로드 에러:", error);

      if (error.response) {
        console.log(`HTTP ${error.response.status} 에러: `, error.response.data);
        return {
          success: false,
          error: error.response.data?.message || "관광지 정보를 불러오는데 실패",
          status: error.response.status,
        };
      } else if (error.request) {
        return {
          success: false,
          error: "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.",
        };
      } else {
        return {
          success: false,
          error: "요청 처리 중 오류가 발생했습니다.",
        };
      }
    }
  },
};

export default apiClient;
