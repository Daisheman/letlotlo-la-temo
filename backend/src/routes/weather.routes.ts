import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";
import { getCurrentWeather, getForecastWeather, getHistoricalWeather } from "../services/weather-service.js";

const router = Router();
router.use(authenticate);

const coordSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number()
});

router.get(
  "/current",
  asyncHandler(async (req, res) => {
    const query = coordSchema.parse(req.query);
    res.json({ weather: await getCurrentWeather(query.lat, query.lng) });
  })
);

router.get(
  "/forecast",
  asyncHandler(async (req, res) => {
    const query = coordSchema.extend({ days: z.coerce.number().optional() }).parse(req.query);
    res.json({ weather: await getForecastWeather(query.lat, query.lng, query.days ?? 14) });
  })
);

router.get(
  "/historical",
  asyncHandler(async (req, res) => {
    const query = coordSchema.extend({ months: z.coerce.number().optional() }).parse(req.query);
    res.json({ weather: await getHistoricalWeather(query.lat, query.lng, query.months ?? 24) });
  })
);

export default router;
