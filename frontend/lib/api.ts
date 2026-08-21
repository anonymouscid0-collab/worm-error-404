import axios from "axios";

const API_URL = "https://worm-error-404.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  role: "USER" | "ADMIN";
  plan: "FREE" | "PRO";
  messagesUsed: number;
  freeLimit: number;
}
