import { getJsonCache, setJsonCache } from "../lib/redis.js";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const WATER_TTL_SECONDS = 60 * 60 * 24 * 7;

function roundCoord(value: number) {
  return Number(value.toFixed(4));
}

function normalizeElement(element: any) {
  const tags = element.tags ?? {};
  return {
    id: String(element.id),
    osmType: element.type,
    lat: element.lat ?? element.center?.lat,
    lng: element.lon ?? element.center?.lon,
    name: tags.name ?? tags.waterway ?? tags.man_made ?? tags.natural ?? "Water source",
    type: tags.man_made ?? tags.waterway ?? tags.natural ?? tags.amenity ?? "water",
    tags
  };
}

export async function getNearbyWaterSources(lat: number, lng: number, radius = 10000) {
  const safeRadius = Math.min(Math.max(radius, 1000), 50000);
  const cacheKey = `water:${roundCoord(lat)}:${roundCoord(lng)}:${safeRadius}`;
  const cached = await getJsonCache<unknown[]>(cacheKey);
  if (cached) return cached;

  const query = `
    [out:json][timeout:25];
    (
      node["man_made"~"water_well|borehole"](around:${safeRadius},${lat},${lng});
      node["amenity"="drinking_water"](around:${safeRadius},${lat},${lng});
      node["natural"="spring"](around:${safeRadius},${lat},${lng});
      way["waterway"~"river|stream|canal"](around:${safeRadius},${lat},${lng});
      relation["waterway"~"river|stream|canal"](around:${safeRadius},${lat},${lng});
    );
    out center tags;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }).toString()
  });
  if (!response.ok) throw new Error(`Overpass API failed: ${response.status}`);

  const data = await response.json();
  const sources = (data.elements ?? []).map(normalizeElement).filter((item: any) => item.lat && item.lng);
  await setJsonCache(cacheKey, sources, WATER_TTL_SECONDS);
  return sources;
}
