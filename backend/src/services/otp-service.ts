import bcrypt from "bcryptjs";
import type { OtpPurpose, User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { logAuthEvent } from "./auth-event-service.js";

const OTP_EXPIRY_MINUTES: Record<OtpPurpose, number> = {
  EMAIL_VERIFICATION: 15,
  PASSWORD_RESET: 15,
  MFA_LOGIN: 10
};

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function assertOtpSendAllowed(email: string, purpose: OtpPurpose, perHour = 3) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.emailOtp.count({
    where: { email: email.toLowerCase(), purpose, createdAt: { gte: since } }
  });
  if (count >= perHour) throw new AppError(429, "Too many codes requested. Try again later.");
}

export async function createOtp(user: Pick<User, "id" | "email">, purpose: OtpPurpose, ipAddress?: string | null) {
  await assertOtpSendAllowed(user.email, purpose, purpose === "MFA_LOGIN" ? 5 : 3);
  const code = generateOtpCode();
  const hashed = await bcrypt.hash(code, 10);
  await prisma.emailOtp.create({
    data: {
      userId: user.id,
      email: user.email.toLowerCase(),
      code: hashed,
      purpose,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES[purpose] * 60 * 1000),
      ipAddress: ipAddress ?? null
    }
  });
  return code;
}

export async function verifyOtp(email: string, code: string, purpose: OtpPurpose, ipAddress?: string | null) {
  const otp = await prisma.emailOtp.findFirst({
    where: {
      email: email.toLowerCase(),
      purpose,
      usedAt: null
    },
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });
  if (!otp) throw new AppError(400, "Code not found. Request a new code.");
  if (otp.attempts >= otp.maxAttempts) throw new AppError(423, "Too many attempts. Request a new code.");
  if (otp.expiresAt <= new Date()) throw new AppError(410, "Code expired. Request a new code.");

  const valid = await bcrypt.compare(code, otp.code);
  if (!valid) {
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    await logAuthEvent({
      userId: otp.userId,
      email,
      type: "OTP_FAILED",
      ipAddress,
      metadata: { purpose }
    });
    throw new AppError(400, "Invalid code. Try again.");
  }

  await prisma.emailOtp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return otp.user;
}
