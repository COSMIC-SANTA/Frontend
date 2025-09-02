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

  // 1. 배너: 관심사별 산 목록
export const mountainService = {
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
  
  //해당부분 작업중 (^-^)-------*
  async fetchDetailByName(mountainName, { signal } = {}) {
    return apiClient.post(
      "/api/main/banner/click",
      { mountainName },
      { signal }
    );
  },
// -------------------

};


//2. 산이름 검색해서 좌표알아내고 날씨정보 받는 api 요청
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
},
};

// 3. 주변 편의시설 조회
export const facilityService = {
  getNearbyFacilities: async (
    { mapX, mapY, location_x, location_y },
    { signal } = {}
  ) => {
    // 1) 최종 좌표 결정 + 숫자 변환(서버가 숫자를 기대할 가능성 큼)
    const xNum = Number(mapX ?? location_x);
    const yNum = Number(mapY ?? location_y);

    if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
      throw new Error(`Invalid coords: mapX=${mapX ?? location_x}, mapY=${mapY ?? location_y}`);
    }

    // 요청/응답 디버깅 로그 (개발 중에만)
    const logFail = (err) => {
      /* eslint-disable no-console */
      console.log('facilities API error =>', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: (err?.config && (err.config.baseURL + err.config.url)) || undefined,
        payload: err?.config?.data,
        headers: err?.config?.headers,
      });
      /* eslint-enable no-console */
    };

    // 2) JSON 바디 시도
    try {
      const res = await apiClient.post(
        "/api/mountains/facilities",
        { mapX: xNum, mapY: yNum }, // ← 숫자(JSON)
        { signal, headers: { "Content-Type": "application/json" } }
      );

      const payload = res?.data ?? {};
      const normalize = (arr = []) =>
        arr.map((it) => ({
          place_name: String(it?.placeName ?? ""),
          address_name: String(it?.addressName ?? ""),
          location_x: Number(it?.mapX ?? NaN), // 경도
          location_y: Number(it?.mapY ?? NaN), // 위도
          distance: Number(it?.distance ?? 0),
        }));

      return {
        toilet: normalize(payload.toilet),
        water: normalize(payload.water),
        hospital: normalize(payload.hospital),
        pharmacy: normalize(payload.pharmacy),
      };
    } catch (err) {
      // 3) JSON이 400이면 서버가 form을 기대할 수도 있음 → fallback
      logFail(err);

      // form-urlencoded로 다시 시도
      try {
        const body = new URLSearchParams({
          mapX: String(xNum),
          mapY: String(yNum),
        }).toString();

        const res2 = await apiClient.post(
          "/api/mountains/facilities",
          body,
          {
            signal,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );

        const payload = res2?.data ?? {};
        const normalize = (arr = []) =>
          arr.map((it) => ({
            place_name: String(it?.placeName ?? ""),
            address_name: String(it?.addressName ?? ""),
            location_x: Number(it?.mapX ?? NaN),
            location_y: Number(it?.mapY ?? NaN),
            distance: Number(it?.distance ?? 0),
          }));

        return {
          toilet: normalize(payload.toilet),
          water: normalize(payload.water),
          hospital: normalize(payload.hospital),
          pharmacy: normalize(payload.pharmacy),
        };
      } catch (err2) {
        logFail(err2);
        throw err2; // 둘 다 실패면 밖으로
      }
    }
  },
};




export default apiClient;

