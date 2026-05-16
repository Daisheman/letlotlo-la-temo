import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { getCurrentWeather } from "./weather-service.js";
import { getSoilData } from "./soil-service.js";
import { getNearbyWaterSources } from "./water-service.js";
import type { FarmContext } from "../types/domain.js";

export async function getOwnedFarm(userId: string, farmId: string) {
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, userId },
    include: { crops: true, livestock: true, user: true }
  });
  if (!farm) throw new AppError(404, "Farm not found");
  return farm;
}

export async function getFarmContext(userId: string, farmId: string): Promise<FarmContext> {
  const farm = await getOwnedFarm(userId, farmId);
  const [weather, soil, waterSources] = await Promise.allSettled([
    getCurrentWeather(farm.lat, farm.lng),
    getSoilData(farm.lat, farm.lng),
    getNearbyWaterSources(farm.lat, farm.lng, 10000)
  ]);

  return {
    farmId: farm.id,
    userId: farm.userId,
    user: {
      name: farm.user.name,
      preferredLanguage: farm.user.preferredLanguage,
      tier: farm.user.tier,
      locationName: farm.user.locationName
    },
    farm: {
      name: farm.name,
      sizeHectares: farm.sizeHectares,
      lat: farm.lat,
      lng: farm.lng,
      soilType: farm.soilType,
      soilPh: farm.soilPh,
      soilOrganicCarbon: farm.soilOrganicCarbon,
      soilClayPct: farm.soilClayPct,
      soilSandPct: farm.soilSandPct,
      waterSource: farm.waterSource,
      boreholeDepthMeters: farm.boreholeDepthMeters,
      farmHealthScore: farm.farmHealthScore,
      notes: farm.notes
    },
    crops: farm.crops.map((crop) => ({
      name: crop.name,
      variety: crop.variety,
      status: crop.status,
      plantedDate: crop.plantedDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      areaHectares: crop.areaHectares,
      yieldKg: crop.yieldKg,
      notes: crop.notes
    })),
    livestock: farm.livestock.map((group) => ({
      id: group.id,
      species: group.species,
      breed: group.breed,
      count: group.count,
      notes: group.notes
    })),
    weather: weather.status === "fulfilled" ? weather.value : { error: weather.reason?.message ?? "Weather unavailable" },
    soil: soil.status === "fulfilled" ? soil.value : { error: soil.reason?.message ?? "Soil unavailable" },
    waterSources: waterSources.status === "fulfilled" ? waterSources.value : []
  };
}

export async function getLivestockContext(userId: string, livestockId: string): Promise<FarmContext> {
  const livestock = await prisma.livestock.findFirst({
    where: { id: livestockId, farm: { userId } },
    include: { farm: { include: { user: true, crops: true, livestock: true } }, healthEvents: { orderBy: { createdAt: "desc" }, take: 5 } }
  });
  if (!livestock) throw new AppError(404, "Livestock group not found");

  const context = await getFarmContext(userId, livestock.farmId);
  return {
    ...context,
    extra: {
      selectedLivestock: livestock,
      recentHealthEvents: livestock.healthEvents
    }
  };
}
