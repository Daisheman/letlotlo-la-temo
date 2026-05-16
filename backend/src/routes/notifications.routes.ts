import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { registerPushToken, sendToUsers } from "../services/notification-service.js";

const router = Router();

router.post(
  "/register-token",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ pushToken: z.string().min(10) }).parse(req.body);
    const user = await registerPushToken(req.user.id, body.pushToken);
    res.json({ user });
  })
);

router.post(
  "/send",
  asyncHandler(async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (!adminKey || adminKey !== env.JWT_SECRET) throw new AppError(403, "Admin key required");
    const body = z
      .object({
        userIds: z.array(z.string().uuid()).min(1),
        title: z.string().min(2),
        body: z.string().min(2),
        data: z.record(z.unknown()).optional()
      })
      .parse(req.body);
    const tickets = await sendToUsers(body.userIds, body.title, body.body, body.data);
    res.json({ tickets });
  })
);

export default router;
