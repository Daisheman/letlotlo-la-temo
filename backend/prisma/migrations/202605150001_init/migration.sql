CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "UserTier" AS ENUM ('FREE', 'PREMIUM');
CREATE TYPE "Language" AS ENUM ('EN', 'TN');
CREATE TYPE "WaterSource" AS ENUM ('BOREHOLE', 'RIVER', 'RAIN', 'MUNICIPAL', 'MIXED');
CREATE TYPE "CropStatus" AS ENUM ('PLANNED', 'GROWING', 'HARVESTED', 'FAILED');
CREATE TYPE "RecommendationType" AS ENUM ('CROP', 'IRRIGATION', 'FERTILIZER', 'PEST', 'LIVESTOCK', 'GENERAL');
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');
CREATE TYPE "MessageType" AS ENUM ('FARMING', 'LIVESTOCK', 'GENERAL');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'GRACE_PERIOD');
CREATE TYPE "Platform" AS ENUM ('IOS', 'ANDROID', 'WEB');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "email" TEXT NOT NULL,
  "password_hash" TEXT,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "location_lat" DOUBLE PRECISION,
  "location_lng" DOUBLE PRECISION,
  "location_name" TEXT NOT NULL DEFAULT '',
  "tier" "UserTier" NOT NULL DEFAULT 'FREE',
  "revenuecat_user_id" TEXT,
  "preferred_language" "Language" NOT NULL DEFAULT 'EN',
  "push_token" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "farms" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "size_hectares" DOUBLE PRECISION NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "soil_type" TEXT,
  "soil_ph" DOUBLE PRECISION,
  "soil_organic_carbon" DOUBLE PRECISION,
  "soil_clay_pct" DOUBLE PRECISION,
  "soil_sand_pct" DOUBLE PRECISION,
  "water_source" "WaterSource" NOT NULL,
  "borehole_depth_meters" DOUBLE PRECISION,
  "farm_health_score" INTEGER,
  "notes" TEXT,
  "photo_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crops" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "farm_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "variety" TEXT,
  "planted_date" DATE,
  "expected_harvest_date" DATE,
  "area_hectares" DOUBLE PRECISION NOT NULL,
  "status" "CropStatus" NOT NULL,
  "yield_kg" DOUBLE PRECISION,
  "notes" TEXT,
  "photo_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "livestock" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "farm_id" UUID NOT NULL,
  "species" TEXT NOT NULL,
  "breed" TEXT,
  "count" INTEGER NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "livestock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_events" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "livestock_id" UUID NOT NULL,
  "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "symptoms" TEXT NOT NULL,
  "photo_url" TEXT,
  "ai_diagnosis" TEXT,
  "ai_treatment" TEXT,
  "ai_medicines" TEXT,
  "ai_model_used" TEXT,
  "must_call_vet" BOOLEAN NOT NULL DEFAULT false,
  "must_report_authorities" BOOLEAN NOT NULL DEFAULT false,
  "vet_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_recommendations" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "farm_id" UUID NOT NULL,
  "type" "RecommendationType" NOT NULL,
  "recommendation" TEXT NOT NULL,
  "ai_model_used" TEXT NOT NULL,
  "context_snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "farm_id" UUID,
  "livestock_id" UUID,
  "session_id" TEXT NOT NULL,
  "role" "ChatRole" NOT NULL,
  "content" TEXT NOT NULL,
  "image_url" TEXT,
  "ai_model_used" TEXT,
  "message_type" "MessageType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "weather_cache" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data" JSONB NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "weather_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "soil_cache" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data" JSONB NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "soil_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "revenuecat_subscription_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL,
  "platform" "Platform" NOT NULL,
  "current_period_end" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_usage_log" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "model" TEXT NOT NULL,
  "task_type" TEXT NOT NULL,
  "tokens_used" INTEGER NOT NULL,
  "latency_ms" INTEGER NOT NULL,
  "success" BOOLEAN NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_usage_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "farms_user_id_idx" ON "farms"("user_id");
CREATE INDEX "crops_farm_id_idx" ON "crops"("farm_id");
CREATE INDEX "livestock_farm_id_idx" ON "livestock"("farm_id");
CREATE INDEX "health_events_livestock_id_idx" ON "health_events"("livestock_id");
CREATE INDEX "ai_recommendations_farm_id_idx" ON "ai_recommendations"("farm_id");
CREATE INDEX "ai_recommendations_type_idx" ON "ai_recommendations"("type");
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages"("user_id");
CREATE INDEX "chat_messages_farm_id_idx" ON "chat_messages"("farm_id");
CREATE INDEX "chat_messages_livestock_id_idx" ON "chat_messages"("livestock_id");
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");
CREATE INDEX "weather_cache_lat_lng_idx" ON "weather_cache"("lat", "lng");
CREATE INDEX "weather_cache_expires_at_idx" ON "weather_cache"("expires_at");
CREATE INDEX "soil_cache_lat_lng_idx" ON "soil_cache"("lat", "lng");
CREATE INDEX "soil_cache_expires_at_idx" ON "soil_cache"("expires_at");
CREATE UNIQUE INDEX "subscriptions_revenuecat_subscription_id_key" ON "subscriptions"("revenuecat_subscription_id");
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");
CREATE INDEX "ai_usage_log_user_id_idx" ON "ai_usage_log"("user_id");
CREATE INDEX "ai_usage_log_model_idx" ON "ai_usage_log"("model");
CREATE INDEX "ai_usage_log_created_at_idx" ON "ai_usage_log"("created_at");

ALTER TABLE "farms" ADD CONSTRAINT "farms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crops" ADD CONSTRAINT "crops_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "livestock" ADD CONSTRAINT "livestock_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "health_events" ADD CONSTRAINT "health_events_livestock_id_fkey" FOREIGN KEY ("livestock_id") REFERENCES "livestock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_livestock_id_fkey" FOREIGN KEY ("livestock_id") REFERENCES "livestock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
