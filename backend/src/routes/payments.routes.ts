import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { handleRevenueCatWebhook } from "../services/revenuecat-service.js";

const router = Router();

router.post(
  "/revenuecat-webhook",
  asyncHandler(async (req, res) => {
    if (env.REVENUECAT_WEBHOOK_SECRET) {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`) {
        throw new AppError(401, "Invalid RevenueCat webhook secret");
      }
    }

    const result = await handleRevenueCatWebhook(req.body);
    res.json(result);
  })
);

router.get(
  "/subscription-status",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" }
    });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { tier: true, revenuecatUserId: true } });
    res.json({ tier: user?.tier ?? "FREE", revenuecatUserId: user?.revenuecatUserId, subscription });
  })
);

export default router;
