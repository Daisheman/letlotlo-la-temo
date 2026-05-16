import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "kefilwe@example.com" },
    update: {
      name: "Kefilwe Mokobi",
      phone: "+267 71234567",
      locationLat: -21.1667,
      locationLng: 27.5167,
      locationName: "Francistown, Botswana",
      preferredLanguage: "EN"
      ,
      emailVerified: true,
      emailVerifiedAt: new Date()
    },
    create: {
      email: "kefilwe@example.com",
      passwordHash,
      name: "Kefilwe Mokobi",
      phone: "+267 71234567",
      locationLat: -21.1667,
      locationLng: 27.5167,
      locationName: "Francistown, Botswana",
      preferredLanguage: "EN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      revenuecatUserId: "demo_kefilwe_mokobi"
    }
  });

  await prisma.farm.deleteMany({ where: { userId: user.id } });

  const farm = await prisma.farm.create({
    data: {
      userId: user.id,
      name: "Mokobi Francistown Farm",
      sizeHectares: 5,
      lat: -21.1667,
      lng: 27.5167,
      soilType: "Francistown loamy soil",
      soilPh: 6.4,
      soilOrganicCarbon: 1.2,
      soilClayPct: 24,
      soilSandPct: 54,
      waterSource: "BOREHOLE",
      boreholeDepthMeters: 58,
      farmHealthScore: 78,
      notes: "Demo farm with borehole water and mixed crop-livestock activity.",
      crops: {
        create: [
          {
            name: "Maize",
            variety: "SC 719",
            plantedDate: daysFromNow(-60),
            expectedHarvestDate: daysFromNow(60),
            areaHectares: 2,
            status: "GROWING",
            notes: "Growing well, needs nitrogen top dressing."
          },
          {
            name: "Sorghum",
            variety: "Macia",
            plantedDate: null,
            expectedHarvestDate: null,
            areaHectares: 1.5,
            status: "PLANNED",
            notes: "Planned as a drought-tolerant follow-up crop."
          }
        ]
      },
      livestock: {
        create: [
          { species: "Cattle", breed: "Tswana", count: 12, notes: "Breeding herd, good body condition." },
          { species: "Goats", breed: "Boer", count: 8, notes: "Browsing near borehole paddock." },
          { species: "Chickens", breed: "Indigenous", count: 30, notes: "Mixed free-range flock." }
        ]
      }
    }
  });

  await prisma.soilCache.create({
    data: {
      lat: -21.1667,
      lng: 27.5167,
      data: {
        source: "Sample Francistown soil profile",
        phh2o: 6.4,
        soc: 12,
        clay: 24,
        sand: 54,
        silt: 22,
        nitrogen: 0.09,
        cec: 9.4,
        recommendation: "Add compost or manure before planting and monitor nitrogen for maize."
      },
      expiresAt: daysFromNow(30)
    }
  });

  await prisma.weatherCache.create({
    data: {
      lat: -21.1667,
      lng: 27.5167,
      data: {
        source: "Sample weather cache",
        current: {
          temperature_2m: 27,
          precipitation: 0,
          windspeed_10m: 13,
          relative_humidity_2m: 42
        },
        daily: {
          temperature_2m_max: [29, 31, 32],
          temperature_2m_min: [17, 18, 19],
          precipitation_sum: [0, 4, 9],
          windspeed_10m_max: [16, 18, 20]
        }
      },
      expiresAt: daysFromNow(1)
    }
  });

  await prisma.aiRecommendation.create({
    data: {
      farmId: farm.id,
      type: "CROP",
      aiModelUsed: "claude-sonnet-4-20250514",
      recommendation:
        "For this Francistown loamy soil and borehole water, keep maize on the best 2 ha and plant sorghum or cowpeas on the drier blocks. Apply 200 kg/ha Compound D before planting sorghum and top-dress maize with 150 kg/ha ammonium nitrate if rain or irrigation is available. PRIORITY ACTION: Check maize leaf color and apply nitrogen within the next 7 days if leaves are pale green.",
      contextSnapshot: {
        farmName: farm.name,
        location: "Francistown",
        soilType: "loamy",
        waterSource: "BOREHOLE",
        crops: ["Maize", "Sorghum"],
        livestock: ["12 Tswana cattle", "8 Boer goats", "30 chickens"]
      }
    }
  });

  console.log("Seeded demo farmer Kefilwe Mokobi with farm, crops, livestock, soil, weather, and AI recommendation.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
