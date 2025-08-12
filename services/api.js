//작성시 get 요청인지 post 요청인지 구분하는게 제일 중요!!!!

import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 응답 인터셉터: { message, data }로 래핑하되,
//    data.data 없으면 data 자체를 그대로 반환 (배열/원시도 OK)
apiClient.interceptors.response.use(
  (res) => {
    const d = res?.data;
    return {
      message: d && typeof d === "object" ? d.message ?? null : null,
      data: d?.data ?? d ?? null,
    };
  },
  (err) => Promise.reject(err)
);

export const mountainService = {
  // 배너: 관심사별 산 목록
  fetchByInterest: async (interest, { signal } = {}) => {
    const res = await apiClient.get("/api/main/banner", {
      params: { type: "interest", interest },
      signal,
    });
    // res = { message, data: { interest, mountains } }  또는 백엔드에 따라 data가 바로 mountains일 수도
    const payload = res?.data;
    const list = Array.isArray(payload) ? payload : (payload?.mountains ?? []);
    return list.map((m) => ({
      id: String(m.id),
      name: m.name,
      image: m.imageUrl || null,
    }));
  },
};

export const weatherService = {
  // ① 산 이름 검색 → 후보 리스트
  searchMountainsByName: async (mountainName, { signal } = {}) => {
    const res = await apiClient.get("/api/mountains/search", {
      params: { mountainName },
      signal,
    });

    // 응답이 [ ... ] 또는 { mountains: [ ... ] } 모두 대응
    const payload = res?.data;
    const list = Array.isArray(payload) ? payload : (payload?.mountains ?? []);

    return list.map((m) => ({
      mountainName: String(m.mountainName ?? ""),
      mountainAddress: String(m.mountainAddress ?? ""),
      // 문자열/숫자 모두 허용 (사용 시 Number(...)로 변환)
      mapX: m.mapX ?? "",
      mapY: m.mapY ?? "",
    }));
  },

  // 좌표로 현재 날씨 조회
getCurrentWeather: async ({ mapX, mapY }, { signal } = {}) => {
     const res = await apiClient.post(
      "/api/main/weather",
      { mapX: Number(mapX), mapY: Number(mapY) }, // JSON body
      { signal }
       );
     return res.data; // 인터셉터로 { temperature, weatherCode }만 남음
}

};

export default apiClient;

