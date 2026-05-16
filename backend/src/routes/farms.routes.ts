import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { imageUpload } from "../middleware/upload.js";
import { uploadImageBuffer } from "../services/cloudinary-service.js";
import { getOwnedFarm } from "../services/farm-context-service.js";

const router = Router();
router.use(authenticate);

const farmSchema = z.object({
  name: z.string().min(2),
  sizeHectares: z.coerce.number().positive(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  soilType: z.string().nullable().optional(),
  soilPh: z.coerce.number().nullable().optional(),
  soilOrganicCarbon: z.coerce.number().nullable().optional(),
  soilClayPct: z.coerce.number().nullable().optional(),
  soilSandPct: z.coerce.number().nullable().optional(),
  waterSource: z.enum(["BOREHOLE", "RIVER", "RAIN", "MUNICIPAL", "MIXED"]),
  boreholeDepthMeters: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional()
});

function calculateFarmHealthScore(farm: Awaited<ReturnType<typeof getOwnedFarm>>) {
  let score = 55;
  if (farm.soilPh && farm.soilPh >= 5.8 && farm.soilPh <= 7.2) score += 12;
  if (farm.soilOrganicCarbon && farm.soilOrganicCarbon >= 1) score += 12;
  if (farm.soilClayPct && farm.soilSandPct && farm.soilClayPct >= 15 && farm.soilSandPct <= 65) score += 8;
  if (["BOREHOLE", "RIVER", "MIXED"].includes(farm.waterSource)) score += 8;
  if (farm.crops.some((crop) => crop.status === "FAILED")) score -= 10;
  if (farm.livestock.length > 0 && farm.crops.length > 0) score += 5;
  return Math.max(0, Math.min(100, score));
}

router.get(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    const farms = await prisma.farm.findMany({
      where: { userId: req.user.id },
      include: { crops: true, livestock: true, recommendations: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ farms });
  })
);

router.post(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    const input = farmSchema.parse(req.body);
    const farm = await prisma.farm.create({ data: { ...input, userId: req.user.id } });
    res.status(201).json({ farm });
  })
);

router.get(
  "/:id/health-score",
  asyncHandler<AuthRequest>(async (req, res) => {
    const farm = await getOwnedFarm(req.user.id, req.params.id);
    const score = calculateFarmHealthScore(farm);
    const updated = await prisma.farm.update({ where: { id: farm.id }, data: { farmHealthScore: score } });
    res.json({ farmId: updated.id, farmHealthScore: score });
  })
);

router.post(
  "/:id/photo",
  imageUpload.single("photo"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const farm = await getOwnedFarm(req.user.id, req.params.id);
    if (!req.file) throw new AppError(400, "Photo file is required");
    const photoUrl = await uploadImageBuffer(req.file.buffer, `letlotlo/farms/${farm.id}`);
    const updated = await prisma.farm.update({ where: { id: farm.id }, data: { photoUrl } });
    res.json({ farm: updated });
  })
);

router.get(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    const farm = await prisma.farm.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        crops: { orderBy: { createdAt: "desc" } },
        livestock: { include: { healthEvents: { orderBy: { createdAt: "desc" }, take: 3 } } },
        recommendations: { orderBy: { createdAt: "desc" }, take: 5 }
      }
    });
    if (!farm) throw new AppError(404, "Farm not found");
    res.json({ farm });
  })
);

router.put(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.id);
    const input = farmSchema.partial().parse(req.body);
    const farm = await prisma.farm.update({ where: { id: req.params.id }, data: input });
    res.json({ farm });
  })
);

router.delete(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.id);
    await prisma.farm.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
