import type { AuthEventType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function logAuthEvent(input: {
  userId?: string | null;
  email?: string | null;
  type: AuthEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.authEvent.create({
    data: {
      userId: input.userId ?? null,
      email: input.email?.toLowerCase() ?? null,
      type: input.type,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: (input.metadata ?? undefined) as any
    }
  });
}

export async function isIpTemporarilyBlocked(ipAddress?: string | null) {
  if (!ipAddress) return false;
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const failed = await prisma.authEvent.count({
    where: {
      ipAddress,
      type: "LOGIN_FAILED",
      createdAt: { gte: hourAgo }
    }
  });
  if (failed < 10) return false;
  const recentSuccess = await prisma.authEvent.findFirst({
    where: {
      ipAddress,
      type: "LOGIN_SUCCESS",
      createdAt: { gte: fifteenMinutesAgo }
    }
  });
  return !recentSuccess;
}
