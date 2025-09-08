// services/api.js (통합/정리본 - JS)

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/* ─────────────────────────────────────────────
 *  작은 유틸: sleep / withRetry (네트워크·5xx만 재시도)
 *  - 조회성 API에만 사용(POST라도 조회성일 때만!)
 * ───────────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, {
  tries = 3,
  backoffMs = 300,
  isRetryable = (err) => {
    const s = err?.response?.status;
    // 네트워크 오류 또는 5xx만 재시도
    return !s || (s >= 500 && s < 600);
  },
} = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // 취소이거나 재시도 불가이거나 마지막 시도면 바로 throw
      if (axios.isCancel?.(err) || !isRetryable(err) || i === tries - 1) {
        throw err;
      }
      await sleep(backoffMs * (i + 1));
    }
  }
  throw lastErr;
}

/* ─────────────────────────────────────────────
 *  쿠키 헬퍼 (웹에서만)
 * ───────────────────────────────────────────── */
const cookieHelpers = {
  removeCookie: (name) => {
    if (typeof document !== 'undefined' && document?.cookie !== undefined) {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        const patterns = [
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${host}`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=strict`,
        ];
        patterns.forEach((p) => (document.cookie = p));
        console.log(`[cookie] '${name}' 삭제 완료`);
      } catch (e) {
        console.warn(`[cookie] '${name}' 삭제 실패:`, e);
      }
    }
  },
  setCookie: (name, value) => {
    if (typeof document !== 'undefined' && document?.cookie !== undefined) {
      try {
        document.cookie = `${name}=${value}; path=/; secure; samesite=strict`;
        console.log(`[cookie] '${name}' 설정 완료`);
      } catch (e) {
        console.warn(`[cookie] '${name}' 설정 실패:`, e);
      }
    }
  },
};

/* ─────────────────────────────────────────────
 *  인증 데이터 정리
 * ───────────────────────────────────────────── */
const clearAllAuthData = async (reason = '로그아웃') => {
  try {
    await AsyncStorage.removeItem('authToken');
    cookieHelpers.removeCookie('accessToken');
    console.log(`[auth] ${reason} → 토큰/쿠키 삭제 완료`);
  } catch (e) {
    console.error('[auth] 인증 데이터 삭제 실패:', e);
  }
};

/* ─────────────────────────────────────────────
 *  API 베이스 URL
 * ───────────────────────────────────────────── */
const getApiUrl = () => 'http://api-santa.com';
const API_BASE_URL = getApiUrl();

/* ─────────────────────────────────────────────
 *  Axios 인스턴스 2종
 *   - api: 기본(Content-Type 가변, 주로 form)
 *   - apiJson: JSON 전용
 * ───────────────────────────────────────────── */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Content-Type는 요청마다 지정 (form/json 혼용)
});

const apiJson = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/* ─────────────────────────────────────────────
 *  공통 요청 인터셉터(토큰 주입)
 *  - 토큰이 있으면 Authorization 헤더 추가
 *  - 특정 요청에서 토큰을 강제로 빼려면 config.skipAuth = true
 * ───────────────────────────────────────────── */
const attachAuthInterceptor = (instance, tag) => {
  instance.interceptors.request.use(
    async (config) => {
      try {
        if (!config.skipAuth) {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
            console.log(
              `[${tag} req] Auth ok → ${config.method?.toUpperCase()} ${config.url}`
            );
          } else {
            console.log(
              `[${tag} req] No token → ${config.method?.toUpperCase()} ${config.url}`
            );
          }
        }
      } catch (e) {
        console.error(`[${tag} req] 토큰 로드 실패:`, e);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

attachAuthInterceptor(api, 'api');
attachAuthInterceptor(apiJson, 'apiJson');

/* ─────────────────────────────────────────────
 *  공통 응답 인터셉터(정규화 + 401/400 인증정리)
 *  - 어떤 응답이든 { message, data }로 통일
 *  - 401 또는 인증 관련 400에서 토큰/쿠키 정리
 * ───────────────────────────────────────────── */
const normalizeResponse = (res) => {
  const d = res?.data;
  return {
    message: d && typeof d === 'object' ? d.message ?? null : null,
    data: d?.data ?? d ?? null,
  };
};

const attachResponseInterceptor = (instance, tag) => {
  instance.interceptors.response.use(
    (res) => {
      const norm = normalizeResponse(res);
      // console.log(`[${tag} res]`, res.status, res.config.url, norm);
      return norm;
    },
    async (err) => {
      const status = err.response?.status || 'Network';
      const method = err.config?.method?.toUpperCase();
      const url = err.config?.url;
      console.log(`[${tag} err] ${status} ${method} ${url}`);
      console.log(`[${tag} err] body:`, err.response?.data || err.message);

      if (err.response?.status === 401) {
        await clearAllAuthData('인증 만료');
      } else if (err.response?.status === 400) {
        const msg = err.response?.data?.message || '';
        if (msg.includes('토큰') || msg.includes('인증') || msg.includes('로그인')) {
          await clearAllAuthData('인증 오류');
        }
      }
      return Promise.reject(err);
    }
  );
};

attachResponseInterceptor(api, 'api');
attachResponseInterceptor(apiJson, 'apiJson');

/* ─────────────────────────────────────────────
 *  서비스 레이어
 *  모든 함수는 일관되게 { message, data } 규격을 사용
 * ───────────────────────────────────────────── */

// 1) 배너: 관심사별 목록 + 배너 클릭(상세 조회/카운팅)
export const mountainService = {
  // 조회성 → withRetry 적용
  fetchByInterest: async (interest, { signal } = {}) => {
    const { data: payload } = await withRetry(
      () =>
        api.get('/api/main/banner', {
          params: { type: 'interest', interest },
          signal,
        }),
      { tries: 3, backoffMs: 300 }
    );
    const list = Array.isArray(payload) ? payload : payload?.mountains ?? [];
    return list.map((m) => ({
      id: String(m.id ?? m.mountainId ?? ''),
      name: m.name ?? m.mountainName ?? '',
      image: m.image_url ?? m.imageUrl ?? null,
      activity: m.difficulty ?? null,
    }));
  },

  // 상태변경/집계 → 재시도 금지(중복 방지)
  fetchDetailByName: async (mountainName, { signal } = {}) => {
    const res = await api.post(
      '/api/main/banner/click',
      { mountainName },
      { signal, headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
  },
};

// 2) 날씨 (산 이름 → 좌표 검색, 좌표 → 현재 날씨)
export const weatherService = {
  searchMountainsByName: async (mountainName, { signal } = {}) => {
    const { data: payload } = await api.get('/api/mountains/search', {
      params: { mountainName },
      signal,
    });
    const list = Array.isArray(payload) ? payload : payload?.mountains ?? [];
    return list.map((m) => ({
      mountainName: String(m.mountainName ?? ''),
      mountainAddress: String(m.mountainAddress ?? ''),
      mapX: m.mapX ?? '',
      mapY: m.mapY ?? '',
    }));
  },

  // 조회성 → withRetry 적용 (간헐 5xx 방어)
  getCurrentWeather: async ({ mapX, mapY }, { signal } = {}) => {
    const x = Number(mapX);
    const y = Number(mapY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Invalid coords: mapX=${mapX}, mapY=${mapY}`);
    }
    const { data: rowsRaw } = await withRetry(
      () =>
        api.post(
          '/api/main/weather',
          { mapX: x, mapY: y },
          { signal, headers: { 'Content-Type': 'application/json' } }
        ),
      { tries: 3, backoffMs: 300 }
    );

    const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
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

// 3) 주변 편의시설
export const facilityService = {
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

    // 1차: JSON 바디(조회성 → withRetry)
    try {
      const { data: payload } = await withRetry(
        () =>
          api.post(
            '/api/mountains/facilities',
            { mapX: xNum, mapY: yNum },
            { signal, headers: { 'Content-Type': 'application/json' } }
          ),
        { tries: 2, backoffMs: 300 }
      );
      return {
        toilet: normalize(payload?.toilet),
        water: normalize(payload?.water),
        hospital: normalize(payload?.hospital),
        pharmacy: normalize(payload?.pharmacy),
      };
    } catch (err) {
      // 2차: x-www-form-urlencoded 폴백 (여기도 조회성 → withRetry)
      const body = new URLSearchParams({
        mapX: String(xNum),
        mapY: String(yNum),
      }).toString();

      const { data: payload } = await withRetry(
        () =>
          api.post('/api/mountains/facilities', body, {
            signal,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }),
        { tries: 2, backoffMs: 300 }
      );
      return {
        toilet: normalize(payload?.toilet),
        water: normalize(payload?.water),
        hospital: normalize(payload?.hospital),
        pharmacy: normalize(payload?.pharmacy),
      };
    }
  },
};

// 4) 로그인/로그아웃 (토큰 저장/삭제)
export const loginService = {
  login: async (username, password) => {
    await clearAllAuthData('새 로그인 시도');

    const requestData = {
      username: String(username ?? '').trim(),
      password: String(password ?? '').trim(),
    };

    // 로그인은 보통 공개 엔드포인트 → skipAuth로 Authorization 생략 보장
    const { data } = await apiJson.post('/api/auth/login', requestData, {
      skipAuth: true,
    });

    const token = data?.accessToken ?? data?.token ?? null;
    if (token) {
      await AsyncStorage.setItem('authToken', token);
      cookieHelpers.setCookie('accessToken', token);
      return { success: true, accessToken: token, message: data?.message ?? null };
    }
    return { success: false, accessToken: null, message: '토큰이 응답에 없습니다.' };
  },

  logout: async () => {
    await clearAllAuthData('수동 로그아웃');
    return { success: true, message: '로그아웃되었습니다.' };
  },
};

// 5) 여행 계획
export const planService = {
  savePlan: async (plan) => {
    try {
      const { data } = await apiJson.post('/api/plan', plan);
      return { success: true, data, message: '여행 계획 저장 완료' };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '서버 오류가 발생했습니다.',
          status: error.response.status,
        };
      }
      if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다.' };
      }
      return { success: false, error: '요청 처리 중 오류가 발생했습니다.' };
    }
  },

  loadPlan: async () => {
    try {
      const { data, message } = await api.get('/api/plan');
      return { success: true, message, data };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '계획 조회 중 서버 오류',
          status: error.response.status,
          data: [],
        };
      }
      if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다.', data: [] };
      }
      return { success: false, error: '계획 조회 처리 중 오류', data: [] };
    }
  },

  completePlan: async (completedPlanId) => {
    try {
      const { data } = await apiJson.post('/api/plan/complete', { planId: completedPlanId });
      return { success: true, data, message: '계획 완료 처리 성공' };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '계획 완료 처리 실패',
          status: error.response.status,
          data: [],
        };
      }
      if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다.', data: [] };
      }
      return { success: false, error: '요청 처리 중 오류', data: [] };
    }
  },

  loadCompletedPlan: async () => {
    try {
      const { data, message } = await api.get('/api/plan/complete');
      return { success: true, message, data };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '계획 조회 중 서버 오류',
          status: error.response.status,
          data: [],
        };
      }
      if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다.', data: [] };
      }
      return { success: false, error: '계획 조회 처리 중 오류', data: [] };
    }
  },
};

// 6) 검색(로컬 히스토리 포함)
export const searchService = {
  searchMountain: async (searchQuery, { signal } = {}) => {
    const query = (searchQuery ?? '').toString().trim();
    if (!query) {
      return { success: false, error: '검색어를 입력해주세요.', data: [] };
    }
    try {
      const { data: payload } = await api.get('/api/mountains/search', {
        params: { mountainName: query },
        signal,
      });
      const list = Array.isArray(payload) ? payload : payload?.mountains ?? [];
      return { success: true, data: list, message: `"${query}" 검색 완료`, searchQuery: query };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '검색 중 서버 오류',
          status: error.response.status,
          data: [],
        };
      }
      if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다.', data: [] };
      }
      return { success: false, error: '검색 요청 처리 중 오류', data: [] };
    }
  },

  saveSearchHistory: async (searchQuery) => {
    try {
      const query = (searchQuery ?? '').toString().trim();
      if (!query) return;
      const existing = await AsyncStorage.getItem('searchHistory');
      let history = existing ? JSON.parse(existing) : [];
      history = history.filter((q) => q !== query);
      history.unshift(query);
      if (history.length > 10) history = history.slice(0, 10);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(history));
    } catch (e) {
      console.error('[searchHistory] 저장 실패:', e);
    }
  },

  getSearchHistory: async () => {
    try {
      const existing = await AsyncStorage.getItem('searchHistory');
      return existing ? JSON.parse(existing) : [];
    } catch (e) {
      console.error('[searchHistory] 조회 실패:', e);
      return [];
    }
  },

  clearSearchHistory: async () => {
    try {
      await AsyncStorage.removeItem('searchHistory');
    } catch (e) {
      console.error('[searchHistory] 삭제 실패:', e);
    }
  },
};

// 7) 관광/경로
export const tourismService = {
  saveMountainsFromApi: async () => {
    try {
      const { data } = await api.get('/api/main/saveMountainsFromApi');
      return { success: true, message: '산 데이터 저장 성공', data };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '산 데이터 저장 실패',
          status: error.response.status,
        };
      }
      if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다.' };
      }
      return { success: false, error: '요청 처리 중 오류' };
    }
  },

  clickBanner: async (mountainName) => {
    try {
      const { data, message } = await api.post(
        '/api/main/banner/click',
        { mountainName },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return { data, message };
    } catch (error) {
      if (error.response) {
        return {
          error: error.response.data?.message || '배너 클릭 실패',
          status: error.response.status,
        };
      }
      if (error.request) {
        return { error: '서버에 연결할 수 없습니다.' };
      }
      return { error: '요청 처리 중 오류' };
    }
  },

  getTouristSpots: async (location, pageNo = 1, { signal } = {}) => {
    try {
      const { data: payload } = await api.get(
        `/api/mountains/${location}/${pageNo}`,
        { signal }
      );
      return {
        cafeDTO: payload?.cafeDTO,
        restaurantDTO: payload?.restaurantDTO,
        stayDTO: payload?.stayDTO,
        touristSpotDTO: payload?.touristSpotDTO,
      };
    } catch (error) {
      if (error.response) {
        return {
          error: error.response.data?.message || '관광지 정보 로드 실패',
          status: error.response.status,
        };
      }
      if (error.request) {
        return { error: '서버에 연결할 수 없습니다.' };
      }
      return { error: '요청 처리 중 오류' };
    }
  },

  getOptimalRoute: async (routeData) => {
    try {
      const { data } = await apiJson.post('/api/mountains/optimalRoute', routeData);
      return { success: true, data, message: '최적 경로 계산 성공' };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || '최적 경로 계산 실패',
          status: error.response.status,
        };
      }
      if (error.request) {
        return { success: false, error: '서버에 연결할 수 없습니다.' };
      }
      return { success: false, error: '요청 처리 중 오류' };
    }
  },
};

export { api, API_BASE_URL, apiJson };
export default api;
