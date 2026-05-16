import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { getOwnedFarm } from "../services/farm-context-service.js";

const router = Router({ mergeParams: true });
router.use(authenticate);

const livestockSchema = z.object({
  species: z.string().min(2),
  breed: z.string().nullable().optional(),
  count: z.coerce.number().int().positive(),
  notes: z.string().nullable().optional()
});

// GET all livestock for a farm
router.get(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const livestock = await prisma.livestock.findMany({
      where: { farmId: req.params.farmId },
      include: {
        healthEvents: {
          orderBy: { createdAt: "desc" },
          take: 2
        }
      },
      orderBy: { species: "asc" }
    });
    res.json({ livestock });
  })
);

// POST create livestock
router.post(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const input = livestockSchema.parse(req.body);
    const livestock = await prisma.livestock.create({
      data: {
        species: input.species,
        breed: input.breed ?? null,
        count: input.count,
        notes: input.notes ?? null,
        farm: {
          connect: { id: req.params.farmId }
        }
      }
    });
    res.status(201).json({ livestock });
  })
);

// PUT update livestock
router.put(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const existing = await prisma.livestock.findFirst({
      where: {
        id: req.params.id,
        farmId: req.params.farmId
      }
    });
    if (!existing) throw new AppError(404, "Livestock group not found");
    const input = livestockSchema.partial().parse(req.body);
    const livestock = await prisma.livestock.update({
      where: { id: req.params.id },
      data: {
        ...(input.species && { species: input.species }),
        ...(input.breed !== undefined && { breed: input.breed }),
        ...(input.count && { count: input.count }),
        ...(input.notes !== undefined && { notes: input.notes })
      }
    });
    res.json({ livestock });
  })
);

// DELETE livestock
router.delete(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getOwnedFarm(req.user.id, req.params.farmId);
    const existing = await prisma.livestock.findFirst({
      where: {
        id: req.params.id,
        farmId: req.params.farmId
      }
    });
    if (!existing) throw new AppError(404, "Livestock group not found");
    await prisma.livestock.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;