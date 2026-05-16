import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

function key32(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key32(env.TOTP_ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string) {
  const [ivText, tagText, encryptedText] = payload.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key32(env.TOTP_ENCRYPTION_KEY), Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64")), decipher.final()]).toString("utf8");
}

export function hashDeviceFingerprint(fingerprint: string) {
  return crypto.createHmac("sha256", env.TRUSTED_DEVICE_SECRET).update(fingerprint).digest("hex");
}

export function validatePasswordStrength(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password);
}

export async function ensurePasswordNotReused(userId: string, newPassword: string) {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  for (const old of history) {
    if (await bcrypt.compare(newPassword, old.passwordHash)) return false;
  }
  return true;
}

export async function addPasswordHistory(userId: string, passwordHash: string) {
  await prisma.passwordHistory.create({ data: { userId, passwordHash } });
  const rows = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 5
  });
  if (rows.length) await prisma.passwordHistory.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } });
}

export function createTotpSecret(email: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, "Letlotlo la Temo", secret);
  return { secret, otpauth };
}

export function verifyTotp(secret: string, code: string) {
  return authenticator.check(code, secret);
}

export function generateBackupCodes() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")
  );
}
