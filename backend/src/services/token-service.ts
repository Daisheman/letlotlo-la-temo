import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type TokenPayload = {
  sub: string;
  email: string;
  tier: "FREE" | "PREMIUM";
  rv?: number;
};

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function signPasswordResetToken(userId: string) {
  return jwt.sign({ sub: userId, purpose: "password_reset" }, env.JWT_REFRESH_SECRET, { expiresIn: "10m" });
}

export function verifyPasswordResetToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; purpose: string };
  if (payload.purpose !== "password_reset") throw new Error("Invalid reset token");
  return payload.sub;
}

export function signMfaToken(userId: string) {
  return jwt.sign({ sub: userId, purpose: "mfa_login" }, env.JWT_SECRET, { expiresIn: "10m" });
}

export function verifyMfaToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; purpose: string };
  if (payload.purpose !== "mfa_login") throw new Error("Invalid MFA token");
  return payload.sub;
}
