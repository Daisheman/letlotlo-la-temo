CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'MFA_LOGIN');
CREATE TYPE "MfaMethod" AS ENUM ('EMAIL', 'TOTP');
CREATE TYPE "AuthEventType" AS ENUM ('REGISTER', 'EMAIL_VERIFICATION_SENT', 'EMAIL_VERIFIED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'MFA_REQUIRED', 'MFA_VERIFIED', 'MFA_ENABLED', 'MFA_DISABLED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_VERIFIED', 'PASSWORD_CHANGED', 'OTP_FAILED');
CREATE TYPE "PostCategory" AS ENUM ('CROPS', 'LIVESTOCK', 'SOIL', 'WEATHER', 'EQUIPMENT', 'MARKET_PRICES', 'SUCCESS_STORIES', 'QUESTIONS', 'GENERAL');
CREATE TYPE "PostStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'REMOVED');
CREATE TYPE "ReactionType" AS ENUM ('HELPFUL', 'LEARNED', 'THANKS');

ALTER TABLE "users"
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_verified_at" TIMESTAMP(3),
  ADD COLUMN "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mfa_method" "MfaMethod",
  ADD COLUMN "totp_secret" TEXT,
  ADD COLUMN "mfa_enabled_at" TIMESTAMP(3),
  ADD COLUMN "backup_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "refresh_token_version" INTEGER NOT NULL DEFAULT 0;

UPDATE "users" SET "email_verified" = true, "email_verified_at" = CURRENT_TIMESTAMP;

CREATE TABLE "email_otps" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "purpose" "OtpPurpose" NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" TEXT,
  CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trusted_devices" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "device_fingerprint" TEXT NOT NULL,
  "device_name" TEXT NOT NULL,
  "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "password_history" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_events" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID,
  "email" TEXT,
  "type" "AuthEventType" NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_posts" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "author_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" "PostCategory" NOT NULL,
  "status" "PostStatus" NOT NULL DEFAULT 'ACTIVE',
  "photo_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "district" TEXT,
  "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
  "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_comments" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "post_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "photo_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
  "is_best_answer" BOOLEAN NOT NULL DEFAULT false,
  "parent_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_reactions" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "post_id" UUID,
  "comment_id" UUID,
  "type" "ReactionType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_bookmarks" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_reputation" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "post_count" INTEGER NOT NULL DEFAULT 0,
  "helpful_count" INTEGER NOT NULL DEFAULT 0,
  "best_answer_count" INTEGER NOT NULL DEFAULT 0,
  "badge" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_reputation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "market_prices" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "crop" TEXT NOT NULL,
  "price_per_kg" DOUBLE PRECISION NOT NULL,
  "district" TEXT NOT NULL,
  "market_name" TEXT,
  "reported_by" UUID NOT NULL,
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_otps_email_purpose_created_at_idx" ON "email_otps"("email", "purpose", "created_at");
CREATE INDEX "email_otps_user_id_purpose_idx" ON "email_otps"("user_id", "purpose");
CREATE INDEX "email_otps_expires_at_idx" ON "email_otps"("expires_at");
CREATE UNIQUE INDEX "trusted_devices_user_id_device_fingerprint_key" ON "trusted_devices"("user_id", "device_fingerprint");
CREATE INDEX "trusted_devices_expires_at_idx" ON "trusted_devices"("expires_at");
CREATE INDEX "password_history_user_id_created_at_idx" ON "password_history"("user_id", "created_at");
CREATE INDEX "auth_events_user_id_created_at_idx" ON "auth_events"("user_id", "created_at");
CREATE INDEX "auth_events_email_created_at_idx" ON "auth_events"("email", "created_at");
CREATE INDEX "auth_events_ip_address_type_created_at_idx" ON "auth_events"("ip_address", "type", "created_at");
CREATE INDEX "community_posts_author_id_idx" ON "community_posts"("author_id");
CREATE INDEX "community_posts_category_status_created_at_idx" ON "community_posts"("category", "status", "created_at");
CREATE INDEX "community_posts_district_idx" ON "community_posts"("district");
CREATE INDEX "community_posts_is_pinned_created_at_idx" ON "community_posts"("is_pinned", "created_at");
CREATE INDEX "community_comments_post_id_created_at_idx" ON "community_comments"("post_id", "created_at");
CREATE INDEX "community_comments_author_id_idx" ON "community_comments"("author_id");
CREATE INDEX "community_comments_parent_id_idx" ON "community_comments"("parent_id");
CREATE UNIQUE INDEX "community_reactions_user_id_post_id_type_key" ON "community_reactions"("user_id", "post_id", "type");
CREATE UNIQUE INDEX "community_reactions_user_id_comment_id_type_key" ON "community_reactions"("user_id", "comment_id", "type");
CREATE INDEX "community_reactions_post_id_idx" ON "community_reactions"("post_id");
CREATE INDEX "community_reactions_comment_id_idx" ON "community_reactions"("comment_id");
CREATE UNIQUE INDEX "community_bookmarks_user_id_post_id_key" ON "community_bookmarks"("user_id", "post_id");
CREATE INDEX "community_bookmarks_post_id_idx" ON "community_bookmarks"("post_id");
CREATE UNIQUE INDEX "user_reputation_user_id_key" ON "user_reputation"("user_id");
CREATE INDEX "market_prices_crop_district_created_at_idx" ON "market_prices"("crop", "district", "created_at");
CREATE INDEX "market_prices_reported_by_idx" ON "market_prices"("reported_by");

ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_bookmarks" ADD CONSTRAINT "community_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_bookmarks" ADD CONSTRAINT "community_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_reputation" ADD CONSTRAINT "user_reputation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
