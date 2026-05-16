import axios from "axios";
import { getSecureItem, secureKeys, setSecureItem } from "./storage";
import type { User } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = await getSecureItem(secureKeys.refreshToken);
  if (!refreshToken) return null;
  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  await setSecureItem(secureKeys.accessToken, response.data.accessToken);
  await setSecureItem(secureKeys.refreshToken, response.data.refreshToken);
  return response.data.accessToken as string;
}

api.interceptors.request.use(async (config) => {
  const token = await getSecureItem(secureKeys.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken().finally(() => (refreshing = null));
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  await setSecureItem(secureKeys.accessToken, data.accessToken);
  await setSecureItem(secureKeys.refreshToken, data.refreshToken);
  return data.user as User;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  preferredLanguage: "EN" | "TN";
}) {
  const { data } = await api.post("/auth/register", input);
  if (data.accessToken) {
    await setSecureItem(secureKeys.accessToken, data.accessToken);
    await setSecureItem(secureKeys.refreshToken, data.refreshToken);
  }
  return data.user as User;
}

export async function verifyEmail(email: string, code: string) {
  const { data } = await api.post("/auth/verify-email", { email, code });
  await setSecureItem(secureKeys.accessToken, data.accessToken);
  await setSecureItem(secureKeys.refreshToken, data.refreshToken);
  return data.user as User;
}

export async function resendVerification(email: string) {
  await api.post("/auth/resend-verification", { email });
}

export async function verifyMfa(input: { mfaToken: string; code: string; rememberDevice?: boolean; deviceFingerprint?: string; deviceName?: string }) {
  const { data } = await api.post("/auth/mfa/verify", input);
  await setSecureItem(secureKeys.accessToken, data.accessToken);
  await setSecureItem(secureKeys.refreshToken, data.refreshToken);
  return data.user as User;
}

export async function logout() {
  await api.post("/auth/logout").catch(() => undefined);
  await setSecureItem(secureKeys.accessToken, null);
  await setSecureItem(secureKeys.refreshToken, null);
}
