import * as SecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";

export const cache = new MMKV({ id: "letlotlo-cache" });

export const secureKeys = {
  accessToken: "letlotlo.accessToken",
  refreshToken: "letlotlo.refreshToken"
};

export async function setSecureItem(key: string, value: string | null) {
  if (value === null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getSecureItem(key: string) {
  return SecureStore.getItemAsync(key);
}

export function setCacheJson(key: string, value: unknown) {
  cache.set(key, JSON.stringify({ value, savedAt: new Date().toISOString() }));
}

export function getCacheJson<T>(key: string): { value: T; savedAt: string } | null {
  const raw = cache.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { value: T; savedAt: string };
  } catch {
    return null;
  }
}
