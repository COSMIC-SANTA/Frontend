import axios from "axios";

// API 기본 설정
const API_BASE_URL = "http://localhost:8080"; // 실제 공공데이터 API URL로 교체 예정

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 (API 키 등 추가)
apiClient.interceptors.request.use(
  (config) => {
    // API 키가 필요한 경우 여기서 추가
    // config.params = {
    //   ...config.params,
    //   serviceKey: 'YOUR_API_KEY',
    // };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// 관광 정보 API 서비스
export const tourismService = {
  // 관광지 정보 조회
  getTouristSpots: async (mountainId = "jirisan") => {
    try {
      // 산 ID에 따라 다른 JSON 파일 로드
      let data;
      switch (mountainId) {
        case "seoraksan":
          data = await import("@/data/seoraksan.json");
          break;
        case "songnisan":
          data = await import("@/data/songnisan.json");
          break;
        case "hallasan":
          data = await import("@/data/hallasan.json");
          break;
        case "jirisan":
        default:
          data = await import("@/data/mountainTourism.json");
          break;
      }
      return data.default;
    } catch (error) {
      console.error("관광지 정보 조회 실패:", error);
      throw error;
    }
  },

  // 맛집 정보 조회
  getRestaurants: async (latitude, longitude, radius = 5000) => {
    try {
      // 실제 API 호출 예시 (주석 처리)
      // const response = await apiClient.get('/restaurants', {
      //   params: {
      //     latitude,
      //     longitude,
      //     radius,
      //   },
      // });
      // return response;

      // 임시로 로컬 데이터 반환
      const response = await import("@/data/mountainTourism.json");
      return response.default.touristSpots.filter(
        (spot) => spot.category === "restaurant"
      );
    } catch (error) {
      console.error("맛집 정보 조회 실패:", error);
      throw error;
    }
  },

  // 숙박 정보 조회
  getAccommodations: async (latitude, longitude, radius = 5000) => {
    try {
      // 임시로 로컬 데이터 반환
      const response = await import("@/data/mountainTourism.json");
      return response.default.touristSpots.filter(
        (spot) => spot.category === "hotel"
      );
    } catch (error) {
      console.error("숙박 정보 조회 실패:", error);
      throw error;
    }
  },

  // 카페 정보 조회
  getCafes: async (latitude, longitude, radius = 5000) => {
    try {
      // 임시로 로컬 데이터 반환
      const response = await import("@/data/mountainTourism.json");
      return response.default.touristSpots.filter(
        (spot) => spot.category === "cafe"
      );
    } catch (error) {
      console.error("카페 정보 조회 실패:", error);
      throw error;
    }
  },

  // 경로 최적화 API (향후 구현)
  getOptimalRoute: async (spots) => {
    try {
      // 현재는 간단한 거리 기반 정렬
      // 나중에 실제 경로 최적화 API로 교체
      return spots.sort((a, b) => {
        const distanceA = parseFloat(a.distance.replace("km", ""));
        const distanceB = parseFloat(b.distance.replace("km", ""));
        return distanceA - distanceB;
      });
    } catch (error) {
      console.error("경로 최적화 실패:", error);
      throw error;
    }
  },
};

// 지도/네비게이션 API 서비스
export const navigationService = {
  // 경로 안내 정보 조회
  getDirections: async (origin, destination, mode = "driving") => {
    try {
      // 실제 지도 API (Google Maps, 카카오맵 등) 호출
      // const response = await apiClient.get('/directions', {
      //   params: {
      //     origin,
      //     destination,
      //     mode,
      //   },
      // });

      // 임시 데이터 반환
      return {
        routes: [
          {
            duration: "2h 3.6km",
            distance: "24.3km",
            steps: [
              "출발지에서 택시 이용",
              "지리산 국립공원 입구까지",
              "도보로 등산로 진입",
            ],
          },
        ],
      };
    } catch (error) {
      console.error("경로 안내 조회 실패:", error);
      throw error;
    }
  },
};

export default apiClient;
