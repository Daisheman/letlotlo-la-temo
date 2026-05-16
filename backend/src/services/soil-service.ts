import { prisma } from "../lib/prisma.js";
import { getJsonCache, setJsonCache } from "../lib/redis.js";

const SOIL_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";
const SOIL_TTL_SECONDS = 60 * 60 * 24 * 30;

function roundCoord(value: number) {
  return Number(value.toFixed(4));
}

function addSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

function extractMean(layer: any) {
  const divisor = layer?.unit_measure?.d_factor ?? 1;
  const means =
    layer?.depths
      ?.map((depth: any) => depth?.values?.mean)
      ?.filter((value: unknown) => typeof value === "number") ?? [];
  if (!means.length) return null;
  return means.reduce((sum: number, value: number) => sum + value / divisor, 0) / means.length;
}

function summarizeSoil(raw: any) {
  const layers = raw?.properties?.layers ?? [];
  const byName = Object.fromEntries(layers.map((layer: any) => [layer.name, extractMean(layer)]));
  return {
    source: "ISRIC SoilGrids v2.0",
    phh2o: byName.phh2o,
    soc: byName.soc,
    clay: byName.clay,
    sand: byName.sand,
    silt: byName.silt,
    bdod: byName.bdod,
    cec: byName.cec,
    nitrogen: byName.nitrogen,
    raw
  };
}

export async function getSoilData(lat: number, lng: number) {
  const cacheKey = `soil:${roundCoord(lat)}:${roundCoord(lng)}`;
  const redisCached = await getJsonCache<unknown>(cacheKey);
  if (redisCached) return redisCached;

  const dbCached = await prisma.soilCache.findFirst({
    where: {
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      expiresAt: { gt: new Date() }
    },
    orderBy: { fetchedAt: "desc" }
  });
  if (dbCached) return dbCached.data;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    property: "phh2o,soc,clay,sand,silt,bdod,cec,nitrogen",
    depth: "0-5cm,5-15cm,15-30cm",
    value: "mean"
  });
  const response = await fetch(`${SOIL_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`SoilGrids API failed: ${response.status}`);
  const raw = await response.json();
  const summarized = summarizeSoil(raw);

  await Promise.all([
    setJsonCache(cacheKey, summarized, SOIL_TTL_SECONDS),
    prisma.soilCache.create({
      data: {
        lat: roundCoord(lat),
        lng: roundCoord(lng),
        data: summarized,
        expiresAt: addSeconds(SOIL_TTL_SECONDS)
      }
    })
  ]);

  return summarized;
}
