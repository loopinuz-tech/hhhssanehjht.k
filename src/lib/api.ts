/**
 * EduContest API Client
 * This replaces all direct Supabase calls.
 */

import { supabase } from "@/integrations/supabase/client";

// Productionda har doim api.educontest.uz ishlatilishi shart (Vercel proxy orqali)
const BASE_URL = '/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!reqHeaders['Authorization'] && !reqHeaders['authorization']) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        reqHeaders['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch (_) {}
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: reqHeaders,
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { message: `Server javob berishda xatolik (${response.status})` };
  }

  if (!response.ok) {
    throw data;
  }
  return data;
}

export { request };

export const api = {
  get: (endpoint: string) => request(endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => request(endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (endpoint: string, body?: any) => request(endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: (endpoint: string, body?: any) => request(endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint: string) => request(endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint, { method: 'DELETE' }),
  auth: {
    login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    session: () => request('/auth/session'),
    google: (credential: string) => request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
    telegram: {
      sendOtp: (phone: string) => request('/auth/telegram/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
      verifyOtp: (phone: string, code: string) => request('/auth/telegram/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),
    },
    setSession: (tokens: any) => request('/auth/set-session', { method: 'POST', body: JSON.stringify(tokens) }),
  },
  profile: {
    get: () => request('/profile'),
    update: (data: any) => request('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  dashboard: {
    get: () => request('/dashboard'),
  },
  leaderboard: {
    get: () => request('/leaderboard'),
  },
  educoin: {
    getBalance: () => request('/educoin/balance'),
    dailyLogin: () => request('/educoin/daily-login', { method: 'POST' }),
    add: (data: any) => request('/educoin/add', { method: 'POST', body: JSON.stringify(data) }),
    submitFeedback: (data: any) => request('/educoin/feedback', { method: 'POST', body: JSON.stringify(data) }),
  },
  cards: {
    get: () => request('/user-cards'),
  },
  tests: {
    getFolders: (category?: string, subject?: string) => {
      const q = new URLSearchParams();
      if (category) q.set('category', category);
      if (subject) q.set('subject', subject);
      return request(`/tests?${q.toString()}`);
    }
  },
  ai: {
    chat: (messages: any[]) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  },
  coupons: {
    getAll: () => request('/admin/coupons'),
    create: (data: any) => request('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
    toggle: (id: string, is_active: boolean) => request(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
    delete: (id: string) => request(`/admin/coupons/${id}`, { method: 'DELETE' }),
  }
};
