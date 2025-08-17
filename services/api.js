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

export default apiClient;
