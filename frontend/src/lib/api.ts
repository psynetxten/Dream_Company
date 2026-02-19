import axios from "axios";
import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: Supabase 세션 토큰 자동 삽입
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// 응답 인터셉터: 401 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============================
// API 함수들
// ============================

// 인증
export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// 의뢰
export const ordersApi = {
  create: (data: OrderCreate) => api.post("/orders", data),
  list: () => api.get("/orders"),
  get: (id: string) => api.get(`/orders/${id}`),
  start: (id: string) => api.post(`/orders/${id}/start`),
  getNewspapers: (orderId: string) => api.get(`/newspapers/orders/${orderId}`),
};

// 신문
export const newspapersApi = {
  list: () => api.get("/newspapers"),
  get: (id: string) => api.get(`/newspapers/${id}`),
};

// ============================
// 타입
// ============================
export interface OrderCreate {
  dream_description: string;
  protagonist_name: string;
  target_role: string;
  target_company?: string;
  duration_days: 7 | 14 | 30;
  future_year?: number;
  payment_type: "subscription" | "one_time";
}

export interface Order {
  id: string;
  protagonist_name: string;
  dream_description: string;
  target_role: string;
  target_company?: string;
  duration_days: number;
  future_year: number;
  payment_type: string;
  payment_status: string;
  status: string;
  created_at: string;
  starts_at?: string;
  total_newspapers: number;
  published_newspapers: number;
}

export interface Newspaper {
  id: string;
  order_id: string;
  episode_number: number;
  future_date: string;
  future_date_label?: string;
  headline?: string;
  subhead?: string;
  lead_paragraph?: string;
  body_content?: string;
  sidebar_content: {
    quote?: string;
    stats?: Array<{ label: string; value: string }>;
    episode_summary?: string;
  };
  variables_used: Record<string, string>;
  status: string;
  published_at?: string;
  view_count: number;
  visual_prompt?: string;
  sns_copy?: any;
  ai_model?: string;
}
