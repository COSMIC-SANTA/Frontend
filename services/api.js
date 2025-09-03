// services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

// 에뮬레이터/실기기에 따른 API URL 설정
const getApiUrl = () => {
  // 실제 서버 주소 사용
  return 'http://api-santa.com';
};

const API_BASE_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

const apiClientJson = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: 토큰이 있으면 Authorization 헤더에 추가
apiClientJson.interceptors.request.use(
  async (config) => {
    try {
      await AsyncStorage.removeItem('authToken');
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`test ${token}`);
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - 토큰 포함됨`);
      } else {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - 토큰 없음`);
      }
      console.log(`[API Request] Full URL: ${config.baseURL}${config.url}`);
    } catch (error) {
      console.log("토큰 조회 실패:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 디버깅을 위해 원본 응답 반환 + 401 처리
apiClient.interceptors.response.use(
  (res) => {
    console.log(`[API Response] ${res.status} ${res.config.method?.toUpperCase()} ${res.config.url}`);
    console.log(`[API Response] 원본 data:`, res.data);
    
    // 디버깅을 위해 원본 응답 그대로 반환
    return res.data;
  },
  async (err) => {
    console.log(`[API Error] ${err.response?.status || 'Network'} ${err.config?.method?.toUpperCase()} ${err.config?.url}`);
    console.log(`[API Error] Details:`, err.response?.data || err.message);
    
    // 401 Unauthorized 시 토큰 삭제 (자동 로그아웃)
    if (err.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('authToken');
        console.log("인증 만료로 토큰 삭제");
      } catch (error) {
        console.log("토큰 삭제 실패:", error);
      }
    }
    return Promise.reject(err);
  }
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
      image: m.image_url || null,
      activity: m.difficulty
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

      console.log("로그인 요청 데이터:", requestData);
      console.log("요청 URL:", `${API_BASE_URL}/api/auth/login`);
      
      const response = await apiClientJson.post("/api/auth/login", requestData);
      console.log("로그인 응답 (원본):", response);

      const jsonData = typeof response.data === "string" 
        ? JSON.parse(response.data) 
        : response.data;

      // 문제가 있던 부분 - response 대신 response.data를 사용해야 함
      // const tokenMatch = response.match(/accessToken(.+)/); // ❌ 잘못된 코드
      
      // 수정된 코드: JSON 응답에서 직접 accessToken을 추출
      const token = jsonData.accessToken || null;

      if (token) {
        // AsyncStorage에 토큰 저장 (인터셉터에서 사용)
        await AsyncStorage.setItem('authToken', token);
        // 쿠키에도 저장 (기존 코드)
        if (typeof document !== "undefined" && document?.cookie !== undefined) {
          try {
            document.cookie = `accessToken=${token}; path=/; secure; samesite=strict`;
          } catch (e) {
            console.warn("브라우저 쿠키 저장 실패:", e);
          }
        }
        console.log("저장된 토큰:", token);
      } else {
        console.error("토큰을 찾을 수 없습니다.");
      }

      return {
        message: jsonData.message,
        accessToken: token
      };
    } catch (error) {
      console.error("로그인 실패:", error);
      throw error; // 에러를 다시 던져서 호출하는 쪽에서 처리할 수 있도록
    }
  },
};

// 여행 목록 소개

export const tourismService = {
  /**
   * DB에 산 데이터 저장 (관리자용)
   * GET /api/main/saveMountainsFromApi
   * 반환: 성공/실패 메시지
   */
  saveMountainsFromApi: async () => {
    try {
      console.log("[tourismService.saveMountainsFromApi] 산 데이터 저장 요청 시작");
      const response = await apiClient.get("/api/main/saveMountainsFromApi");
      console.log("[tourismService.saveMountainsFromApi] 성공:", response);
      return {
        success: true,
        message: "산 데이터가 성공적으로 저장되었습니다.",
        data: response
      };
    } catch (error) {
      console.error("[tourismService.saveMountainsFromApi] 에러:", error);
      if (error.response) {
        const { status, data } = error.response;
        return {
          success: false,
          error: data?.message || "산 데이터 저장 실패",
          status,
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

  /**
   * 배너 카드 클릭 기록/조회
   * POST /api/main/banner/click
   * body: { mountainName: string }
   * 반환: apiClient 인터셉터 구조 { message, data }
   */
  clickBanner: async (mountainName) => {
    try {
      const response = await apiClient.post("/api/main/banner/click", { mountainName: mountainName });
      // 인터셉터에 의해 { message, data } 형태
      console.log("[tourismService.clickBanner] 성공:", response);
      return {
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.log("[tourismService.clickBanner] 에러:", error);
      if (error.response) {
        const { status, data } = error.response;
        return {
          error: data?.message || "배너 클릭 요청 실패",
          status,
        };
      } else if (error.request) {
        return {
          error: "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.",
        };
      } else {
        return {
          error: "요청 처리 중 오류가 발생했습니다.",
        };
      }
    }
  },

  // (참고) 이전 GET API는 유지하되 사용 자제 권장
  getTouristSpots: async (location, pageNo = 1, { signal } = {}) => {
    try {
      const response = await apiClient.get(`/api/mountains/${location}/${pageNo}`, { signal });
      console.log(`${location} 관광지 정보 (페이지 ${pageNo})`, response);
      return {
        cafeDTO: response.cafeDTO,
        restaurantDTO: response.restaurantDTO,
        stayDTO: response.stayDTO,
        touristSpotDTO: response.touristSpotDTO
      };
    } catch (error) {
      console.log("관광지 정보 로드 에러:", error);

      if (error.response) {
        console.log(`HTTP ${error.response.status} 에러: `, error.response.data);
        return {
          error: error.response.data?.message || "관광지 정보를 불러오는데 실패",
          status: error.response.status,
        };
      } else if (error.request) {
        return {
          error: "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.",
        };
      } else {
        return {
          error: "요청 처리 중 오류가 발생했습니다.",
        };
      }
    }
  },
    getOptimalRoute: async (routeData) => {
    try {
      console.log("[tourismService.getOptimalRoute] 최적 경로 요청 시작");
      console.log("[tourismService.getOptimalRoute] 요청 데이터:", routeData);
      
      const response = await apiClientJson.post("/api/mountains/optimalRoute", routeData);
      console.log("[tourismService.getOptimalRoute] 성공:", response);
      
      return {
        success: true,
        data: response,
        message: "최적 경로를 성공적으로 계산했습니다."
      };
    } catch (error) {
      console.error("[tourismService.getOptimalRoute] 에러:", error);
      if (error.response) {
        const { status, data } = error.response;
        return {
          success: false,
          error: data?.message || "최적 경로 계산 실패",
          status,
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

export default apiClientJson;
