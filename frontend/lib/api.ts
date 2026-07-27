import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  withCredentials: true,
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
