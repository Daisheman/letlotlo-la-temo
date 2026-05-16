import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";
import { getNearbyWaterSources } from "../services/water-service.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = z
      .object({ lat: z.coerce.number(), lng: z.coerce.number(), radius: z.coerce.number().optional() })
      .parse(req.query);
    res.json({ waterSources: await getNearbyWaterSources(query.lat, query.lng, query.radius ?? 10000) });
  })
);

export default router;
