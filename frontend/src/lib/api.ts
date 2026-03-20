import axios from "axios";
import { supabase } from "./supabase";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname !== "localhost") {
      return `https://${window.location.hostname}`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
};

const API_URL = getBaseUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터: Supabase 세션 토큰 자동 삽입
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// 응답 인터셉터: 401 및 타임아웃 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(new Error('서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.'));
    }
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
  register: (data: { email: string; password: string; full_name: string; role?: string }) =>
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

// 결제
export const paymentApi = {
  verify: (imp_uid: string, merchant_uid: string) =>
    api.post("/payment/verify", null, { params: { imp_uid, merchant_uid } }),
};

// 작가
export const writerApi = {
  getProfile: () => api.get("/writer/me"),
  getAssignedOrders: () => api.get("/writer/orders"),
  getAvailableOrders: () => api.get("/writer/available-orders"),
  claimOrder: (orderId: string) => api.post(`/writer/orders/${orderId}/claim`),
  updateNewspaperDraft: (id: string, content: any) =>
    api.put(`/writer/newspapers/${id}`, content),
};

// 신문
export const newspapersApi = {
  list: () => api.get("/newspapers"),
  get: (id: string) => api.get(`/newspapers/${id}`),
  publicFeed: (limit = 12) => api.get(`/newspapers/public?limit=${limit}`),
};

// 스폰서
export const sponsorApi = {
  getProfile: () => api.get("/sponsor/me"),
  getSlots: () => api.get("/sponsor/slots"),
  getMatches: () => api.get("/sponsor/matches"),
  getAnalytics: () => api.get("/sponsor/analytics"),
  register: (data: SponsorCreate) => api.post("/sponsor/register", data),
  purchaseSlot: (data: SlotCreate) => api.post("/sponsor/slots", data),
};

export interface SponsorCreate {
  company_name: string;
  industry?: string;
  description?: string;
  website_url?: string;
  contact_email?: string;
  target_roles: string[];
  target_companies: string[];
  target_keywords: string[];
}

export interface SlotCreate {
  slot_type: "company_name" | "brand_name" | "banner" | "sidebar";
  variable_value: string;
  purchased_quantity: number;
}

export interface SponsorAnalytics {
  company_name: string;
  total_slots: number;
  active_slots: number;
  total_exposures: number;
  newspapers_featured: number;
  remaining_impressions: number;
}

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
  payment_type: "subscription" | "one_time" | "free";
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
  merchant_uid?: string;
  imp_uid?: string;
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
