# Letlotlo la Temo

Letlotlo la Temo is an Expo React Native mobile app and Node.js API for an AI-powered farming assistant focused on Botswana and Southern Africa.

## Structure

- `backend`: Express, TypeScript, Prisma, PostgreSQL, Redis, AI router, RevenueCat webhooks, Expo push notifications.
- `mobile`: Expo SDK 51, Expo Router, NativeWind, Zustand, TanStack Query, MMKV, SecureStore, maps, camera, notifications, RevenueCat, ads.
- `apps/web`: Next.js web app for auth verification and the farmer community.

## Quick Start

1. Copy `.env.example` to `.env` and fill in service keys.
2. Install dependencies with `npm install`.
3. Generate Prisma client with `npm --workspace backend run prisma:generate`.
4. Run migrations with `npm --workspace backend run prisma:migrate`.
5. Seed demo data with `npm --workspace backend run seed`.
6. Start the API with `npm run backend:dev`.
7. Start Expo with `npm run mobile:start`.
8. Start the web app with `npm --workspace apps/web run dev`.

## New Auth And Community Environment

Add these backend variables before using production email, MFA, and trusted devices:

- `RESEND_API_KEY`: Resend API key for transactional email.
- `EMAIL_FROM`: verified sender, default `noreply@letlotlo.co.bw`.
- `TOTP_ENCRYPTION_KEY`: random secret used to AES-256 encrypt authenticator secrets.
- `TRUSTED_DEVICE_SECRET`: HMAC secret for trusted device fingerprints.

The auth system now supports email verification OTPs, password reset OTPs, email MFA, authenticator-app MFA, backup codes, trusted devices, password-history checks, refresh-token invalidation, and auth event logging.

## Community

The community module adds posts, comments, reactions, bookmarks, reputation, and market prices:

- API root: `GET /api/community/posts`
- Mobile tab: `Community`
- Web pages: `/community`, `/community/new`, `/community/[id]`, `/community/market-prices`

New posts and comments are sanitized and AI-moderated. Posts mentioning notifiable livestock diseases automatically get DVS Botswana guidance.

Demo farmer seed:

- Email: `kefilwe@example.com`
- Password: `Password123!`
- Location: Francistown, Botswana
