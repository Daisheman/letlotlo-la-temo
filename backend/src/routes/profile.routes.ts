import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        locationLat: true,
        locationLng: true,
        locationName: true,
        tier: true,
        revenuecatUserId: true,
        preferredLanguage: true,
        pushToken: true,
        createdAt: true
      }
    });
    res.json({ user });
  })
);

router.put(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).optional(),
        phone: z.string().nullable().optional(),
        locationLat: z.coerce.number().nullable().optional(),
        locationLng: z.coerce.number().nullable().optional(),
        locationName: z.string().optional(),
        preferredLanguage: z.enum(["EN", "TN"]).optional()
      })
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: body,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        locationLat: true,
        locationLng: true,
        locationName: true,
        tier: true,
        revenuecatUserId: true,
        preferredLanguage: true,
        pushToken: true
      }
    });
    res.json({ user });
  })
);

export default router;
