import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Backend base URL. On a physical device `localhost` is the phone itself,
 * so set EXPO_PUBLIC_API_URL to your machine's LAN IP or tunnel URL
 * (e.g. https://<tunnel>.trycloudflare.com).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "crm-token";

async function get(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return (await AsyncStorage.getItem(key)) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function set(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") await AsyncStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function del(key: string): Promise<void> {
  if (Platform.OS === "web") await AsyncStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

export const getToken = () => get(TOKEN_KEY);
export const setToken = (v: string) => set(TOKEN_KEY, v);
export const clearToken = () => del(TOKEN_KEY);

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string>),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`);
  return body as T;
}
