import { create } from "zustand";
import { getCacheJson, setCacheJson } from "@/lib/storage";

type CachedWeather = {
  weather: unknown;
  savedAt: string;
};

type WeatherState = {
  current: CachedWeather | null;
  setCurrent: (weather: unknown) => void;
  hydrate: () => void;
};

export const useWeatherStore = create<WeatherState>((set) => ({
  current: null,
  setCurrent: (weather) => {
    setCacheJson("last-weather", weather);
    set({ current: { weather, savedAt: new Date().toISOString() } });
  },
  hydrate: () => {
    const cached = getCacheJson<unknown>("last-weather");
    set({ current: cached ? { weather: cached.value, savedAt: cached.savedAt } : null });
  }
}));
