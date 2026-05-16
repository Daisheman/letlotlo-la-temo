import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  signMfaToken,
  verifyPasswordResetToken,
  verifyMfaToken,
  verifyRefreshToken
} from "../services/token-service.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { createOtp, verifyOtp } from "../services/otp-service.js";
import {
  mfaEnabledEmail,
  mfaLoginEmail,
  passwordChangedEmail,
  passwordResetEmail,
  sendEmail,
  verificationEmail,
  welcomeEmail
} from "../services/email.js";
import {
  addPasswordHistory,
  createTotpSecret,
  decryptSecret,
  encryptSecret,
  ensurePasswordNotReused,
  generateBackupCodes,
  hashDeviceFingerprint,
  validatePasswordStrength,
  verifyTotp
} from "../services/security-service.js";
import { isIpTemporarilyBlocked, logAuthEvent } from "../services/auth-event-service.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  locationName: z.string().optional(),
  preferredLanguage: z.enum(["EN", "TN"]).default("EN")
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

function publicUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    locationLat: user.locationLat,
    locationLng: user.locationLng,
    locationName: user.locationName,
    tier: user.tier,
    revenuecatUserId: user.revenuecatUserId,
    preferredLanguage: user.preferredLanguage,
    pushToken: user.pushToken,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    mfaEnabled: user.mfaEnabled,
    mfaMethod: user.mfaMethod
  };
}

function issueTokens(user: { id: string; email: string; tier: "FREE" | "PREMIUM"; refreshTokenVersion?: number }) {
  const payload = { sub: user.id, email: user.email, tier: user.tier, rv: user.refreshTokenVersion ?? 0 };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 15 * 60
  };
}

function ip(req: any) {
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

function userAgent(req: any) {
  return req.headers["user-agent"]?.toString() ?? null;
}

async function sendVerification(user: { id: string; email: string; name: string }, req: any, resend = false) {
  const code = await createOtp(user, "EMAIL_VERIFICATION", ip(req));
  await sendEmail(verificationEmail(user.email, user.name, code));
  await logAuthEvent({
    userId: user.id,
    email: user.email,
    type: "EMAIL_VERIFICATION_SENT",
    ipAddress: ip(req),
    userAgent: userAgent(req),
    metadata: { resend }
  });
}

async function checkTrustedDevice(userId: string, fingerprint?: string) {
  if (!fingerprint) return false;
  const deviceFingerprint = hashDeviceFingerprint(fingerprint);
  const trusted = await prisma.trustedDevice.findUnique({
    where: { userId_deviceFingerprint: { userId, deviceFingerprint } }
  });
  if (!trusted || trusted.expiresAt <= new Date()) return false;
  await prisma.trustedDevice.update({ where: { id: trusted.id }, data: { lastUsedAt: new Date() } });
  return true;
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "Email is already registered");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        locationLat: input.locationLat,
        locationLng: input.locationLng,
        locationName: input.locationName ?? "",
        preferredLanguage: input.preferredLanguage
      }
    });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { revenuecatUserId: user.id }
    });

    await addPasswordHistory(updated.id, passwordHash);
    await sendVerification(updated, req);
    await logAuthEvent({ userId: updated.id, email: updated.email, type: "REGISTER", ipAddress: ip(req), userAgent: userAgent(req) });
    res.status(201).json({ user: publicUser(updated), emailVerificationRequired: true });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    if (await isIpTemporarilyBlocked(ip(req))) throw new AppError(429, "Too many failed login attempts. Try again in 15 minutes.");
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash) {
      await logAuthEvent({ email: input.email, type: "LOGIN_FAILED", ipAddress: ip(req), userAgent: userAgent(req) });
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      await logAuthEvent({ userId: user.id, email: user.email, type: "LOGIN_FAILED", ipAddress: ip(req), userAgent: userAgent(req) });
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.emailVerified) {
      await sendVerification(user, req);
      return res.status(403).json({ emailVerificationRequired: true, email: user.email, user: publicUser(user) });
    }

    const deviceFingerprint = z.object({ deviceFingerprint: z.string().optional() }).passthrough().parse(req.body).deviceFingerprint;
    if (user.mfaEnabled && !(await checkTrustedDevice(user.id, deviceFingerprint))) {
      if (user.mfaMethod === "EMAIL") {
        const code = await createOtp(user, "MFA_LOGIN", ip(req));
        await sendEmail(mfaLoginEmail(user.email, user.name, code, ip(req) ?? undefined));
      }
      await logAuthEvent({ userId: user.id, email: user.email, type: "MFA_REQUIRED", ipAddress: ip(req), userAgent: userAgent(req) });
      return res.json({ mfaRequired: true, mfaMethod: user.mfaMethod, mfaToken: signMfaToken(user.id), user: publicUser(user) });
    }

    await logAuthEvent({ userId: user.id, email: user.email, type: "LOGIN_SUCCESS", ipAddress: ip(req), userAgent: userAgent(req) });
    res.json({ user: publicUser(user), ...issueTokens(user) });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const body = z.object({ refreshToken: z.string().min(10) }).parse(req.body);
    const payload = verifyRefreshToken(body.refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new AppError(401, "Invalid refresh token");
    if ((payload.rv ?? 0) !== user.refreshTokenVersion) throw new AppError(401, "Refresh token has been revoked");
    res.json({ user: publicUser(user), ...issueTokens(user) });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    await logAuthEvent({ type: "LOGOUT", ipAddress: ip(req), userAgent: userAgent(req) });
    res.json({ ok: true });
  })
);

router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const body = z.object({ accessToken: z.string().min(10) }).parse(req.body);
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { authorization: `Bearer ${body.accessToken}` }
    });
    if (!response.ok) throw new AppError(401, "Google token could not be verified");
    const profile = await response.json();

    const user = await prisma.user.upsert({
      where: { email: profile.email.toLowerCase() },
      update: {
        name: profile.name ?? profile.email,
        revenuecatUserId: profile.sub
      },
      create: {
        email: profile.email.toLowerCase(),
        name: profile.name ?? profile.email,
        revenuecatUserId: profile.sub,
        locationName: ""
      }
    });

    if (!user.emailVerified) {
      const updated = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
      await sendEmail(welcomeEmail(updated.email, updated.name));
      return res.json({ user: publicUser(updated), ...issueTokens(updated) });
    }
    res.json({ user: publicUser(user), ...issueTokens(user) });
  })
);

router.post(
  "/send-verification",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw new AppError(404, "User not found");
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });
    await sendVerification(user, req);
    res.json({ ok: true });
  })
);

router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email().toLowerCase(), code: z.string().regex(/^\d{6}$/) }).parse(req.body);
    const user = await verifyOtp(body.email, body.code, "EMAIL_VERIFICATION", ip(req));
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() }
    });
    await sendEmail(welcomeEmail(updated.email, updated.name));
    await logAuthEvent({ userId: updated.id, email: updated.email, type: "EMAIL_VERIFIED", ipAddress: ip(req), userAgent: userAgent(req) });
    res.json({ user: publicUser(updated), ...issueTokens(updated) });
  })
);

router.post(
  "/resend-verification",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.json({ ok: true });
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });
    await sendVerification(user, req, true);
    res.json({ ok: true });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const perIp = await prisma.authEvent.count({ where: { ipAddress: ip(req), type: "PASSWORD_RESET_REQUESTED", createdAt: { gte: since } } });
    if (perIp >= 10) throw new AppError(429, "Too many password reset requests from this IP.");
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (user) {
      const code = await createOtp(user, "PASSWORD_RESET", ip(req));
      await sendEmail(passwordResetEmail(user.email, user.name, code));
      await logAuthEvent({ userId: user.id, email: user.email, type: "PASSWORD_RESET_REQUESTED", ipAddress: ip(req), userAgent: userAgent(req) });
    }
    res.json({ ok: true, message: "If that email is registered, you will receive a code." });
  })
);

router.post(
  "/verify-reset-otp",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email().toLowerCase(), code: z.string().regex(/^\d{6}$/) }).parse(req.body);
    const user = await verifyOtp(body.email, body.code, "PASSWORD_RESET", ip(req));
    await logAuthEvent({ userId: user.id, email: user.email, type: "PASSWORD_RESET_VERIFIED", ipAddress: ip(req), userAgent: userAgent(req) });
    res.json({ resetToken: signPasswordResetToken(user.id) });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const body = z
      .object({ resetToken: z.string().min(10), newPassword: z.string().min(8), confirmPassword: z.string().min(8) })
      .parse(req.body);
    if (body.newPassword !== body.confirmPassword) throw new AppError(400, "Passwords do not match");
    if (!validatePasswordStrength(body.newPassword)) throw new AppError(400, "Password must be 8+ chars with uppercase, number, and special character");
    const userId = verifyPasswordResetToken(body.resetToken);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "User not found");
    if (!(await ensurePasswordNotReused(userId, body.newPassword))) throw new AppError(400, "You cannot reuse one of your last 5 passwords");
    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash, refreshTokenVersion: { increment: 1 } } });
    await addPasswordHistory(userId, passwordHash);
    await sendEmail(passwordChangedEmail(user.email, user.name));
    await logAuthEvent({ userId, email: user.email, type: "PASSWORD_CHANGED", ipAddress: ip(req), userAgent: userAgent(req) });
    res.json({ ok: true });
  })
);

router.get(
  "/mfa/status",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { mfaEnabled: true, mfaMethod: true } });
    res.json(user);
  })
);

router.post(
  "/mfa/setup-init",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ password: z.string(), method: z.enum(["EMAIL", "TOTP"]) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) throw new AppError(401, "Current password is incorrect");
    if (!user.emailVerified) throw new AppError(400, "Verify your email before enabling MFA");
    if (body.method === "EMAIL") {
      const code = await createOtp(user, "MFA_LOGIN", ip(req));
      await sendEmail(mfaLoginEmail(user.email, user.name, code, ip(req) ?? undefined));
      return res.json({ method: "EMAIL", sent: true });
    }
    const { secret, otpauth } = createTotpSecret(user.email);
    const encrypted = encryptSecret(secret);
    await prisma.user.update({ where: { id: user.id }, data: { totpSecret: encrypted } });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    res.json({ method: "TOTP", secret, otpauth, qrCodeDataUrl });
  })
);

router.post(
  "/mfa/setup-confirm",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ method: z.enum(["EMAIL", "TOTP"]), code: z.string().min(6).max(10) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AppError(404, "User not found");
    let backupCodes: string[] = [];
    if (body.method === "EMAIL") {
      await verifyOtp(user.email, body.code, "MFA_LOGIN", ip(req));
    } else {
      if (!user.totpSecret) throw new AppError(400, "TOTP setup not initialized");
      if (!verifyTotp(decryptSecret(user.totpSecret), body.code)) throw new AppError(400, "Invalid authenticator code");
      backupCodes = generateBackupCodes();
    }
    const hashedBackupCodes = await Promise.all(backupCodes.map((code) => bcrypt.hash(code, 10)));
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true, mfaMethod: body.method, mfaEnabledAt: new Date(), backupCodes: hashedBackupCodes }
    });
    await sendEmail(mfaEnabledEmail(user.email, user.name));
    await logAuthEvent({ userId: user.id, email: user.email, type: "MFA_ENABLED", ipAddress: ip(req), userAgent: userAgent(req), metadata: { method: body.method } });
    res.json({ ok: true, backupCodes });
  })
);

router.post(
  "/mfa/verify",
  asyncHandler(async (req, res) => {
    const body = z
      .object({ mfaToken: z.string(), code: z.string().min(6).max(10), rememberDevice: z.boolean().optional(), deviceFingerprint: z.string().optional(), deviceName: z.string().optional() })
      .parse(req.body);
    const userId = verifyMfaToken(body.mfaToken);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled) throw new AppError(400, "MFA is not enabled");
    if (user.mfaMethod === "EMAIL") {
      await verifyOtp(user.email, body.code, "MFA_LOGIN", ip(req));
    } else {
      if (!user.totpSecret || !verifyTotp(decryptSecret(user.totpSecret), body.code)) throw new AppError(400, "Invalid authenticator code");
    }
    if (body.rememberDevice && body.deviceFingerprint) {
      await prisma.trustedDevice.upsert({
        where: { userId_deviceFingerprint: { userId: user.id, deviceFingerprint: hashDeviceFingerprint(body.deviceFingerprint) } },
        update: { lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), deviceName: body.deviceName ?? "Trusted device" },
        create: {
          userId: user.id,
          deviceFingerprint: hashDeviceFingerprint(body.deviceFingerprint),
          deviceName: body.deviceName ?? "Trusted device",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }
    await logAuthEvent({ userId: user.id, email: user.email, type: "MFA_VERIFIED", ipAddress: ip(req), userAgent: userAgent(req) });
    res.json({ user: publicUser(user), ...issueTokens(user) });
  })
);

router.post(
  "/mfa/verify-backup",
  asyncHandler(async (req, res) => {
    const body = z.object({ mfaToken: z.string(), backupCode: z.string().min(6) }).parse(req.body);
    const userId = verifyMfaToken(body.mfaToken);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(400, "Invalid MFA session");
    const index = await Promise.all(user.backupCodes.map((hash) => bcrypt.compare(body.backupCode.toUpperCase(), hash))).then((matches) => matches.findIndex(Boolean));
    if (index < 0) throw new AppError(400, "Invalid backup code");
    const remaining = user.backupCodes.filter((_, i) => i !== index);
    await prisma.user.update({ where: { id: user.id }, data: { backupCodes: remaining } });
    res.json({ user: publicUser(user), ...issueTokens(user), remainingBackupCodes: remaining.length });
  })
);

router.post(
  "/mfa/disable",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ password: z.string(), code: z.string().min(6).max(10) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) throw new AppError(401, "Current password is incorrect");
    if (user.mfaMethod === "EMAIL") await verifyOtp(user.email, body.code, "MFA_LOGIN", ip(req));
    if (user.mfaMethod === "TOTP" && (!user.totpSecret || !verifyTotp(decryptSecret(user.totpSecret), body.code))) throw new AppError(400, "Invalid MFA code");
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaMethod: null, totpSecret: null, backupCodes: [], mfaEnabledAt: null, refreshTokenVersion: { increment: 1 } }
    });
    await logAuthEvent({ userId: user.id, email: user.email, type: "MFA_DISABLED", ipAddress: ip(req), userAgent: userAgent(req) });
    res.json({ ok: true });
  })
);

router.post(
  "/mfa/trusted-device",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ deviceFingerprint: z.string().min(8), deviceName: z.string().min(2) }).parse(req.body);
    const device = await prisma.trustedDevice.upsert({
      where: { userId_deviceFingerprint: { userId: req.user.id, deviceFingerprint: hashDeviceFingerprint(body.deviceFingerprint) } },
      update: { deviceName: body.deviceName, lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      create: { userId: req.user.id, deviceFingerprint: hashDeviceFingerprint(body.deviceFingerprint), deviceName: body.deviceName, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });
    res.json({ device });
  })
);

export default router;
