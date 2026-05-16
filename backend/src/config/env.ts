import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/letlotlo_la_temo?schema=public"),
  REDIS_URL: z.string().optional().default(""),
  JWT_SECRET: z.string().default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-me"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  CLOUDINARY_URL: z.string().optional().default(""),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional().default(""),
  EXPO_ACCESS_TOKEN: z.string().optional().default("")
  ,
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("noreply@letlotlo.co.bw"),
  TOTP_ENCRYPTION_KEY: z.string().optional().default("dev-32-char-totp-encryption-key!"),
  TRUSTED_DEVICE_SECRET: z.string().optional().default("dev-trusted-device-secret")
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
