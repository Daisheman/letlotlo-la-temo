import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./utils/errors.js";
import authRoutes from "./routes/auth.routes.js";
import farmRoutes from "./routes/farms.routes.js";
import cropRoutes from "./routes/crops.routes.js";
import livestockRoutes from "./routes/livestock.routes.js";
import healthRoutes from "./routes/health.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import weatherRoutes from "./routes/weather.routes.js";
import soilRoutes from "./routes/soil.routes.js";
import waterRoutes from "./routes/water.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import communityRoutes from "./routes/community.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "letlotlo-la-temo-api", timestamp: new Date().toISOString() });
});

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  }),
  authRoutes
);
app.use("/api/profile", profileRoutes);
app.use("/api/farms/:farmId/crops", cropRoutes);
app.use("/api/farms/:farmId/livestock", livestockRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/livestock/:livestockId/health", healthRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/soil", soilRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/community", communityRoutes);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Letlotlo la Temo API running on http://localhost:${env.PORT}`);
});
