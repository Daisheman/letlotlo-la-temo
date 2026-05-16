import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { getOwnedFarm } from "../services/farm-context-service.js";

const router = Router({ mergeParams: true });
router.use(authenticate);

const cropSchema = z.object({
  name: z.string().min(2),
  variety: z.string().nullable().optional(),
  plantedDate: z.string().nullable().optional(),
  expectedHarvestDate: z.string().nullable().optional(),
  areaHectares: z.coerce.number().positive(),
  status: z.enum(["PLANNED", "GROWING", "HARVESTED", "FAILED"]).default("PLANNED"),
  yieldKg: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional()
});

function asDate(value?: string | null) {
  return value ? new Date(value) : value === null ? null : undefined;
}

function cropData(input: z.infer<typeof cropSchema> | Partial<z.infer<typeof cropSchema>>) {
  return {
    ...input,
    plantedDate: asDate(input.plantedDate),
    expectedHarvestDate: asDate(input.expectedHarvestDate)
  };
}

router.get(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const crops = await prisma.crop.findMany({
      where: { farmId: req.params.farmId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });
    res.json({ crops });
  })
);

router.post(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const input = cropSchema.parse(req.body);
    const crop = await prisma.crop.create({ data: { ...cropData(input), farmId: req.params.farmId } as any });
    res.status(201).json({ crop });
  })
);

router.put(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const existing = await prisma.crop.findFirst({ where: { id: req.params.id, farmId: req.params.farmId } });
    if (!existing) throw new AppError(404, "Crop not found");
    const input = cropSchema.partial().parse(req.body);
    const crop = await prisma.crop.update({ where: { id: req.params.id }, data: cropData(input) as any });
    res.json({ crop });
  })
);

router.delete(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const existing = await prisma.crop.findFirst({ where: { id: req.params.id, farmId: req.params.farmId } });
    if (!existing) throw new AppError(404, "Crop not found");
    await prisma.crop.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
