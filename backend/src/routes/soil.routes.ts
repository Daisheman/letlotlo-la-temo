import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";
import { getSoilData } from "../services/soil-service.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = z.object({ lat: z.coerce.number(), lng: z.coerce.number() }).parse(req.query);
    res.json({ soil: await getSoilData(query.lat, query.lng) });
  })
);

export default router;
