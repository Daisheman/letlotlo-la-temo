import { prisma } from "../lib/prisma.js";
import { getJsonCache, setJsonCache } from "../lib/redis.js";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const WEATHER_TTL_SECONDS = 60 * 60 * 6;

function roundCoord(value: number) {
  return Number(value.toFixed(4));
}

function addSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather API failed: ${response.status}`);
  return response.json();
}

async function getDbWeather(kind: string, lat: number, lng: number) {
  const cached = await prisma.weatherCache.findFirst({
    where: {
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      expiresAt: { gt: new Date() },
      data: { path: ["kind"], equals: kind }
    },
    orderBy: { fetchedAt: "desc" }
  });
  return cached?.data ?? null;
}

async function setDbWeather(kind: string, lat: number, lng: number, data: unknown) {
  await prisma.weatherCache.create({
    data: {
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      data: { kind, payload: data } as any,
      expiresAt: addSeconds(WEATHER_TTL_SECONDS)
    }
  });
}

async function cachedWeather(kind: string, lat: number, lng: number, fetcher: () => Promise<unknown>) {
  const key = `weather:${kind}:${roundCoord(lat)}:${roundCoord(lng)}`;
  const redisCached = await getJsonCache<unknown>(key);
  if (redisCached) return redisCached;

  const dbCached = await getDbWeather(kind, lat, lng);
  if (dbCached && typeof dbCached === "object" && "payload" in dbCached) {
    return (dbCached as { payload: unknown }).payload;
  }

  const fresh = await fetcher();
  await Promise.all([setJsonCache(key, fresh, WEATHER_TTL_SECONDS), setDbWeather(kind, lat, lng, fresh)]);
  return fresh;
}

export async function getCurrentWeather(lat: number, lng: number) {
  return cachedWeather("current", lat, lng, () => {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration",
      timezone: "Africa/Gaborone",
      forecast_days: "3"
    });
    return fetchJson(`${FORECAST_URL}?${params.toString()}`);
  });
}

export async function getForecastWeather(lat: number, lng: number, days = 14) {
  return cachedWeather(`forecast:${days}`, lat, lng, () => {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration,soil_moisture_0_to_1cm",
      timezone: "Africa/Gaborone",
      forecast_days: String(Math.min(Math.max(days, 1), 16))
    });
    return fetchJson(`${FORECAST_URL}?${params.toString()}`);
  });
}

export async function getHistoricalWeather(lat: number, lng: number, months = 24) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - Math.min(Math.max(months, 1), 60));

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  return cachedWeather(`historical:${months}`, lat, lng, () => {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      start_date: startDate,
      end_date: endDate,
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration",
      timezone: "Africa/Gaborone"
    });
    return fetchJson(`${ARCHIVE_URL}?${params.toString()}`);
  });
}
