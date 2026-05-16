import sanitizeHtml from "sanitize-html";
import { prisma } from "../lib/prisma.js";
import { routeAIRequest } from "./ai-router.js";
import { sendPushMessages } from "./notification-service.js";

export function sanitizeContent(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();
}

export function badgeForPoints(points: number) {
  if (points >= 500) return "Community Elder";
  if (points >= 200) return "Expert Farmer";
  if (points >= 50) return "Farmer";
  return "Seedling";
}

export async function awardReputation(userId: string, points: number, counters: Partial<{ postCount: number; helpfulCount: number; bestAnswerCount: number }> = {}) {
  const existing = await prisma.userReputation.findUnique({ where: { userId } });
  const nextPoints = (existing?.points ?? 0) + points;
  return prisma.userReputation.upsert({
    where: { userId },
    update: {
      points: { increment: points },
      postCount: counters.postCount ? { increment: counters.postCount } : undefined,
      helpfulCount: counters.helpfulCount ? { increment: counters.helpfulCount } : undefined,
      bestAnswerCount: counters.bestAnswerCount ? { increment: counters.bestAnswerCount } : undefined,
      badge: badgeForPoints(nextPoints)
    },
    create: {
      userId,
      points,
      postCount: counters.postCount ?? 0,
      helpfulCount: counters.helpfulCount ?? 0,
      bestAnswerCount: counters.bestAnswerCount ?? 0,
      badge: badgeForPoints(points)
    }
  });
}

export async function moderateCommunityContent(content: string) {
  const fallback = { flagged: false, reason: "", notifiableDisease: false };
  try {
    const ai = await routeAIRequest(
      "structured_data",
      `Return JSON only with keys flagged:boolean, reason:string, notifiableDisease:boolean. Check this farmer community content for spam, hate speech, dangerous misinformation, and claims of notifiable animal diseases such as FMD, Anthrax, ASF, Lumpy Skin Disease, CBPP, Newcastle Disease:\n\n${content}`,
      {}
    );
    const parsed = JSON.parse(ai.response);
    return {
      flagged: Boolean(parsed.flagged),
      reason: String(parsed.reason ?? ""),
      notifiableDisease: Boolean(parsed.notifiableDisease)
    };
  } catch {
    const lower = content.toLowerCase();
    return {
      ...fallback,
      notifiableDisease: ["fmd", "foot and mouth", "anthrax", "african swine fever", "asf"].some((term) => lower.includes(term))
    };
  }
}

export async function maybeAddDvsComment(postId: string, authorId: string, content: string) {
  const lower = content.toLowerCase();
  if (!["fmd", "foot and mouth", "anthrax", "african swine fever", "asf", "lumpy skin", "newcastle"].some((term) => lower.includes(term))) return null;
  return prisma.communityComment.create({
    data: {
      postId,
      authorId,
      isAnonymous: true,
      content:
        "Temo AI official safety note: this post mentions a possible notifiable disease. Quarantine affected animals, stop movement, and call DVS Botswana immediately on +267 3950500. Do not open carcasses if Anthrax is suspected."
    }
  });
}

export async function notifyUser(userId: string, title: string, body: string, data: Record<string, unknown>) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
  if (!user?.pushToken) return;
  await sendPushMessages([{ to: user.pushToken, title, body, data, sound: "default" }]);
}
