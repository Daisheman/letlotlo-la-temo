import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../services/token-service.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  tier: "FREE" | "PREMIUM";
  preferredLanguage: "EN" | "TN";
};

export type AuthRequest = Request & {
  user: AuthUser;
};

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new AppError(401, "Missing authorization token");

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, tier: true, preferredLanguage: true }
    });
    if (!user) throw new AppError(401, "User not found");

    (req as AuthRequest).user = user;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export function requirePremium(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user;
  if (user.tier !== "PREMIUM") return next(new AppError(402, "Premium subscription required"));
  return next();
}
