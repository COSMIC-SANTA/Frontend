// services/api.js (통합본)
// 작성시 GET/POST 구분이 제일 중요!!!! 각 함수 위에 명시했습니다.

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/* ─────────────────────────────────────────────
 *  공통 설정
 * ───────────────────────────────────────────── */

// 실제 서버 주소
const getApiUrl = () => 'http://api-santa.com';
const API_BASE_URL = getApiUrl();

// 쿠키 헬퍼 (웹에서만 작동)
const cookieHelpers = {
  removeCookie: (name) => {
    if (typeof document !== 'undefined' && document?.cookie !== undefined) {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        const dels = [
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${host}`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=strict`,
        ];
        dels.forEach((p) => (document.cookie = p));
        console.log(`쿠키 '${name}' 삭제 완료`);
      } catch (e) {
        console.warn(`쿠키 '${name}' 삭제 실패:`, e);
      }
    }
  },
  setCookie: (name, value) => {
    if (typeof document !== 'undefined' && document?.cookie !== undefined) {
      try {
        document.cookie = `${name}=${value}; path=/; secure; samesite=strict`;
        console.log(`쿠키 '${name}' 설정 완료`);
      } catch (e) {
        console.warn(`쿠키 '${name}' 설정 실패:`, e);
      }
    }
  },
};

// 인증 데이터 완전 삭제
const clearAllAuthData = async (reason = '로그아웃') => {
  try {
    await AsyncStorage.removeItem('authToken');
    cookieHelpers.removeCookie('accessToken');
    console.log(`${reason}으로 모든 인증 데이터 삭제 완료`);
  } catch (e) {
    console.error('인증 데이터 삭제 실패:', e);
  }
};

// 공통 응답 정규화: { message, data } 또는 원시/배열 모두 대응
const pickData = (resLike) => {
  // axios 응답 인터셉터가 이미 res.data를 반환한 경우: resLike = 원본 payload
  // 첫 번째 구현처럼 {message, data}인 경우도 처리
  if (resLike == null) return { message: null, data: null };
  if (typeof resLike === 'object' && ('data' in resLike || 'message' in resLike)) {
    // { message?, data? } 형태
    return {
      message: resLike.message ?? null,
      data: resLike.data ?? null,
    };
  }
  // 배열/원시
  return { message: null, data: resLike };
};

/* ─────────────────────────────────────────────
 *  Axios 인스턴스
 *  - apiClient: x-www-form-urlencoded 기본
 *  - apiClientJson: application/json 기본
 * ───────────────────────────────────────────── */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});

const apiClientJson = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터(공통): 토큰 주입
const withAuth = async (config) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Request] Auth 헤더 추가: Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log(`[API Request] 토큰 없음 - ${config.method?.toUpperCase()} ${config.url}`);
    }
  } catch (e) {
    console.error('[API Request] 토큰 조회 실패:', e);
  }
  return config;
};

apiClient.interceptors.request.use(withAuth, (e) => Promise.reject(e));
apiClientJson.interceptors.request.use(withAuth, (e) => Promise.reject(e));

// 응답 인터셉터: 디버깅 로그 + 원본 data 반환(서비스 레이어에서 pickData로 정규화)
const onResponse = (res) => {
  console.log(`[API Response] ${res.status} ${res.config.method?.toUpperCase()} ${res.config.url}`);
  return res.data; // 항상 원본 payload로
};

const onError = async (err) => {
  console.log(
    `[API Error] ${err.response?.status || 'Network'} ${err.config?.method?.toUpperCase()} ${err.config?.url}`
  );
  console.log('[API Error] Details:', err.response?.data || err.message);

  // 인증 오류 시 정리
  if (err.response?.status === 401) {
    await clearAllAuthData('인증 만료');
  } else if (err.response?.status === 400) {
    const msg = err.response?.data?.message || '';
    if (msg.includes('토큰') || msg.includes('인증') || msg.includes('로그인')) {
      await clearAllAuthData('인증 오류');
    }
  }
  return Promise.reject(err);
};

apiClient.interceptors.response.use(onResponse, onError);
apiClientJson.interceptors.response.use(onResponse, onError);

/* ─────────────────────────────────────────────
 *  mountainService
 * ───────────────────────────────────────────── */
export const mountainService = {
  // GET /api/main/banner?type=interest&interest=LOW|HIGH|ACTIVITY|POPULAR(지원시)
  fetchByInterest: async (interest, { signal } = {}) => {
    const raw = await apiClient.get('/api/main/banner', {
      params: { type: 'interest', interest },
      signal,
    });
    // raw는 원본 payload. { message, data:{interest, mountains} } 또는 { mountains } 또는 배열
    const { data } = pickData(raw);
    const list = Array.isArray(raw) ? raw : (data?.mountains ?? raw?.mountains ?? []);
    return (list || []).map((m) => ({
      id: String(m.id),
      name: m.name,
      image: m.imageUrl || m.image_url || null,
      activity: m.difficulty, // 백엔드가 줄 경우
    }));
  },

  // GET /api/mountains/search?mountainName=...
  fetchMountainXY: async (mountainName, { signal } = {}) => {
    const name = (mountainName ?? '').toString().trim();
    if (!name) {
      console.warn('[fetchMountainXY] mountainName 비어있음');
      return { mountains: [] };
    }
    const raw = await apiClient.get('/api/mountains/search', {
      params: { mountainName: name },
      signal,
    });
    // 형태: { mountains:[{ mountainName, mountainAddress, mapX, mapY }, ...] }
    return raw;
  },

  // POST /api/main/banner/click  body: { mountainName }
  fetchDetailByName: async (mountainName, { signal } = {}) => {
    const raw = await apiClientJson.post(
      '/api/main/banner/click',
      { mountainName },
      { signal }
    );
    return pickData(raw); // { message, data }
  },
};

/* ─────────────────────────────────────────────
 *  weatherService
 * ───────────────────────────────────────────── */
export const weatherService = {
  // GET /api/mountains/search?mountainName=...
  searchMountainsByName: async (mountainName, { signal } = {}) => {
    const raw = await apiClient.get('/api/mountains/search', {
      params: { mountainName },
      signal,
    });
    const payload = Array.isArray(raw) ? raw : raw?.mountains ?? [];
    return (payload || []).map((m) => ({
      mountainName: String(m.mountainName ?? ''),
      mountainAddress: String(m.mountainAddress ?? ''),
      mapX: m.mapX ?? '',
      mapY: m.mapY ?? '',
    }));
  },

  // POST /api/main/weather  body: { mapX:number, mapY:number }
  getCurrentWeather: async ({ mapX, mapY }, { signal } = {}) => {
    const x = Number(mapX);
    const y = Number(mapY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Invalid coords: mapX=${mapX}, mapY=${mapY}`);
    }
    const raw = await apiClientJson.post(
      '/api/main/weather',
      { mapX: x, mapY: y },
      { signal }
    );
    // raw는 배열일 수도 있고 {message,data:[...]}일 수도
    const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    if (rows.length === 0) return null;

    const nowHH = `${String(new Date().getHours()).padStart(2, '0')}:00`;
    const cur = rows.find((r) => r?.time === nowHH) || rows[0];

    const normalizeCode = (code, gloomy) => {
      if (code === 'RAIN') return 'RAIN';
      if (code === 'NO_RAIN') return gloomy === 'NO_CLOUD' ? 'CLEAR' : 'CLOUDY';
      return code || null;
    };

    return {
      time: cur?.time ?? null,
      temperature: typeof cur?.temperature === 'number' ? cur.temperature : null,
      weatherCode: normalizeCode(cur?.weatherCode, cur?.gloomyLevel),
      gloomyLevel: cur?.gloomyLevel ?? null,
    };
  },
};

/* ─────────────────────────────────────────────
 *  facilityService
 * ───────────────────────────────────────────── */
export const facilityService = {
  // POST /api/mountains/facilities  body: { mapX, mapY } (JSON 선호, 실패시 form 재시도)
  getNearbyFacilities: async (
    { mapX, mapY, location_x, location_y },
    { signal } = {}
  ) => {
    const xNum = Number(mapX ?? location_x);
    const yNum = Number(mapY ?? location_y);
    if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
      throw new Error(
        `Invalid coords: mapX=${mapX ?? location_x}, mapY=${mapY ?? location_y}`
      );
    }

    const normalize = (arr = []) =>
      arr.map((it) => ({
        place_name: String(it?.placeName ?? ''),
        address_name: String(it?.addressName ?? ''),
        location_x: Number(it?.mapX ?? NaN),
        location_y: Number(it?.mapY ?? NaN),
        distance: Number(it?.distance ?? 0),
      }));

    const logFail = (err) => {
      console.log('facilities API error =>', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url:
          (err?.config && (err.config.baseURL + err.config.url)) || undefined,
        payload: err?.config?.data,
        headers: err?.config?.headers,
      });
    };

    // 1) JSON 시도
    try {
      const raw = await apiClientJson.post(
        '/api/mountains/facilities',
        { mapX: xNum, mapY: yNum },
        { signal }
      );
      const payload = Array.isArray(raw) ? {} : raw?.data ?? raw ?? {};
      return {
        toilet: normalize(payload.toilet),
        water: normalize(payload.water),
        hospital: normalize(payload.hospital),
        pharmacy: normalize(payload.pharmacy),
      };
    } catch (e1) {
      logFail(e1);
      // 2) form 재시도
      try {
        const body = new URLSearchParams({
          mapX: String(xNum),
          mapY: String(yNum),
        }).toString();
        const raw2 = await apiClient.post('/api/mountains/facilities', body, {
          signal,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const payload = Array.isArray(raw2) ? {} : raw2?.data ?? raw2 ?? {};
        return {
          toilet: normalize(payload.toilet),
          water: normalize(payload.water),
          hospital: normalize(payload.hospital),
          pharmacy: normalize(payload.pharmacy),
        };
      } catch (e2) {
        logFail(e2);
        throw e2;
      }
    }
  },
};

/* ─────────────────────────────────────────────
 *  loginService
 * ───────────────────────────────────────────── */
export const loginService = {
  // POST /api/auth/login  body: { username, password }
  login: async (username, password) => {
    try {
      await clearAllAuthData('새 로그인 시도');

      const requestData = {
        username: (username ?? '').trim(),
        password: (password ?? '').trim(),
      };

      console.log('로그인 요청 데이터:', requestData);
      console.log('요청 URL:', `${API_BASE_URL}/api/auth/login`);

      const raw = await apiClientJson.post('/api/auth/login', requestData);
      const jsonData = typeof raw === 'string' ? JSON.parse(raw) : raw;

      const token = jsonData?.accessToken || null;
      if (token) {
        await AsyncStorage.setItem('authToken', token);
        cookieHelpers.setCookie('accessToken', token);
      } else {
        console.error('토큰을 찾을 수 없습니다.');
      }

      return {
        message: jsonData?.message ?? null,
        accessToken: token,
      };
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  },

  // 로그아웃(로컬 정리)
  logout: async () => {
    await clearAllAuthData('수동 로그아웃');
    return { success: true, message: '로그아웃되었습니다.' };
  },
};

/* ─────────────────────────────────────────────
 *  planService
 * ───────────────────────────────────────────── */
export const planService = {
  // POST /api/plan  (JSON)
  savePlan: async (plan) => {
    try {
      console.log('여행 계획 저장 요청:', plan);
      const token = await AsyncStorage.getItem('authToken');
      console.log('현재 저장된 토큰:', token ? `${token.substring(0, 20)}...` : '없음');

      const raw = await apiClientJson.post('/api/plan', plan);
      return {
        success: true,
        data: raw,
        message: '여행 계획이 성공적으로 저장되었습니다.',
      };
    } catch (error) {
      console.error('여행 계획 저장 실패:', error);
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '서버 오류가 발생했습니다.',
          status: error.response.status,
        };
      } else if (error.request) {
        return {
          success: false,
          error: '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
        };
      } else {
        return { success: false, error: '요청 처리 중 오류가 발생했습니다.' };
      }
    }
  },

  // GET /api/plan
  loadPlan: async () => {
    try {
      const raw = await apiClient.get('/api/plan');
      const { message, data } = pickData(raw);
      return { message, data };
    } catch (error) {
      console.error('[planService.loadPlan] 에러:', error);
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '계획을 가져오는 중 서버 오류가 발생했습니다.',
          status: error.response.status,
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          error: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.',
          data: [],
        };
      } else {
        return {
          success: false,
          error: '계획 조회 요청 처리 중 오류가 발생했습니다.',
          data: [],
        };
      }
    }
  },

  // POST /api/plan/complete  body: { planId }
  completePlan: async (completedPlanId) => {
    try {
      const raw = await apiClientJson.post('/api/plan/complete', {
        planId: completedPlanId,
      });
      return {
        success: true,
        data: raw,
        message: '계획이 성공적으로 완료되었습니다.',
      };
    } catch (error) {
      console.error('completePlan 에러: ', error);
      if (error.response) {
        return {
          success: false,
          error:
            error.response.data?.message ||
            '계획을 완료하는 중 서버 오류가 발생했습니다.',
          status: error.response.status,
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          error: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.',
          data: [],
        };
      } else {
        return {
          success: false,
          error: '계획 완료 처리 중 오류가 발생했습니다.',
          data: [],
        };
      }
    }
  },

  // GET /api/plan/complete
  loadCompletedPlan: async () => {
    try {
      const raw = await apiClient.get('/api/plan/complete');
      const { message, data } = pickData(raw);
      return { message, data };
    } catch (error) {
      console.error('[planService.loadCompletedPlan] 에러:', error);
      if (error.response) {
        return {
          success: false,
          error:
            error.response.data?.message ||
            '계획을 가져오는 중 서버 오류가 발생했습니다.',
          status: error.response.status,
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          error: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.',
          data: [],
        };
      } else {
        return {
          success: false,
          error: '계획 조회 요청 처리 중 오류가 발생했습니다.',
          data: [],
        };
      }
    }
  },
};

/* ─────────────────────────────────────────────
 *  searchService
 * ───────────────────────────────────────────── */
export const searchService = {
  // GET /api/mountains/search?mountainName=...
  searchMountain: async (searchQuery, { signal } = {}) => {
    try {
      const query = (searchQuery ?? '').toString().trim();
      if (!query) {
        console.warn('[searchService.searchMountain] 검색어가 비어있음');
        return { success: false, error: '검색어를 입력해주세요.', data: [] };
      }
      console.log(`[searchService.searchMountain] 검색 시작: "${query}"`);
      const raw = await apiClient.get('/api/mountains/search', {
        params: { mountainName: query },
        signal,
      });
      return {
        success: true,
        data: raw?.mountains || [],
        message: `"${query}" 검색 완료`,
        searchQuery: query,
      };
    } catch (error) {
      console.error('[searchService.searchMountain] 에러:', error);
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '검색 중 서버 오류가 발생했습니다.',
          status: error.response.status,
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          error: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.',
          data: [],
        };
      } else {
        return { success: false, error: '검색 요청 처리 중 오류가 발생했습니다.', data: [] };
      }
    }
  },

  // 로컬 검색 기록
  saveSearchHistory: async (searchQuery) => {
    try {
      const query = (searchQuery ?? '').trim();
      if (!query) return;
      const existing = await AsyncStorage.getItem('searchHistory');
      let history = existing ? JSON.parse(existing) : [];
      history = history.filter((x) => x !== query);
      history.unshift(query);
      if (history.length > 10) history = history.slice(0, 10);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(history));
      console.log(`[searchService.saveSearchHistory] 저장: "${query}"`);
    } catch (e) {
      console.error('[searchService.saveSearchHistory] 에러:', e);
    }
  },
  getSearchHistory: async () => {
    try {
      const existing = await AsyncStorage.getItem('searchHistory');
      return existing ? JSON.parse(existing) : [];
    } catch (e) {
      console.error('[searchService.getSearchHistory] 에러:', e);
      return [];
    }
  },
  clearSearchHistory: async () => {
    try {
      await AsyncStorage.removeItem('searchHistory');
      console.log('[searchService.clearSearchHistory] 삭제 완료');
    } catch (e) {
      console.error('[searchService.clearSearchHistory] 에러:', e);
    }
  },
};

/* ─────────────────────────────────────────────
 *  tourismService
 * ───────────────────────────────────────────── */
export const tourismService = {
  // GET /api/main/saveMountainsFromApi
  saveMountainsFromApi: async () => {
    try {
      console.log('[tourismService.saveMountainsFromApi] 요청 시작');
      const raw = await apiClient.get('/api/main/saveMountainsFromApi');
      return { success: true, message: '산 데이터가 성공적으로 저장되었습니다.', data: raw };
    } catch (error) {
      console.error('[tourismService.saveMountainsFromApi] 에러:', error);
      if (error.response) {
        const { status, data } = error.response;
        return {
          success: false,
          error: data?.message || '산 데이터 저장 실패',
          status,
        };
      } else if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.' };
      } else {
        return { success: false, error: '요청 처리 중 오류가 발생했습니다.' };
      }
    }
  },

  // POST /api/main/banner/click  body: { mountainName }
  clickBanner: async (mountainName) => {
    try {
      const raw = await apiClientJson.post('/api/main/banner/click', { mountainName });
      const { message, data } = pickData(raw);
      return { data, message };
    } catch (error) {
      console.log('[tourismService.clickBanner] 에러:', error);
      if (error.response) {
        const { status, data } = error.response;
        return { error: data?.message || '배너 클릭 요청 실패', status };
      } else if (error.request) {
        return { error: '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.' };
      } else {
        return { error: '요청 처리 중 오류가 발생했습니다.' };
      }
    }
  },

  // GET /api/mountains/{location}/{pageNo}
  getTouristSpots: async (location, pageNo = 1, { signal } = {}) => {
    try {
      const raw = await apiClient.get(`/api/mountains/${location}/${pageNo}`, { signal });
      return {
        cafeDTO: raw.cafeDTO,
        restaurantDTO: raw.restaurantDTO,
        stayDTO: raw.stayDTO,
        touristSpotDTO: raw.touristSpotDTO,
      };
    } catch (error) {
      console.log('관광지 정보 로드 에러:', error);
      if (error.response) {
        return {
          error: error.response.data?.message || '관광지 정보를 불러오는데 실패',
          status: error.response.status,
        };
      } else if (error.request) {
        return { error: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.' };
      } else {
        return { error: '요청 처리 중 오류가 발생했습니다.' };
      }
    }
  },

  // POST /api/mountains/optimalRoute (JSON)
  getOptimalRoute: async (routeData) => {
    try {
      console.log('[tourismService.getOptimalRoute] 최적 경로 요청 시작');
      console.log('[tourismService.getOptimalRoute] 요청 데이터:', routeData);
      const raw = await apiClientJson.post('/api/mountains/optimalRoute', routeData);
      return { success: true, data: raw, message: '최적 경로를 성공적으로 계산했습니다.' };
    } catch (error) {
      console.error('[tourismService.getOptimalRoute] 에러:', error);
      if (error.response) {
        const { status, data } = error.response;
        return { success: false, error: data?.message || '최적 경로 계산 실패', status };
      } else if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.' };
      } else {
        return { success: false, error: '요청 처리 중 오류가 발생했습니다.' };
      }
    }
  },
};

/* ─────────────────────────────────────────────
 *  기본 export
 *  - JSON이 기본인 클라이언트를 default로 노출
 * ───────────────────────────────────────────── */
export default apiClientJson;
export { apiClient, apiClientJson };

