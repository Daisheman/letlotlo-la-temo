import { prisma } from "../lib/prisma.js";
import type { Platform, SubscriptionStatus } from "@prisma/client";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function statusForEvent(type: string): SubscriptionStatus {
  if (["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"].includes(type)) return "ACTIVE";
  if (type === "BILLING_ISSUE") return "GRACE_PERIOD";
  if (type === "CANCELLATION") return "CANCELLED";
  return "EXPIRED";
}

function platformForStore(store?: string): Platform {
  if (store === "APP_STORE" || store === "MAC_APP_STORE") return "IOS";
  if (store === "PLAY_STORE") return "ANDROID";
  return "WEB";
}

export async function handleRevenueCatWebhook(payload: any) {
  const event = payload.event ?? payload;
  const appUserId = event.app_user_id ?? event.original_app_user_id;
  if (!appUserId) return { ignored: true, reason: "No app_user_id" };

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(uuidRegex.test(appUserId) ? [{ id: appUserId }] : []),
        { revenuecatUserId: appUserId }
      ]
    }
  });

  if (!user) return { ignored: true, reason: "User not found" };

  const status = statusForEvent(event.type);
  const subscriptionId = String(event.original_transaction_id ?? event.transaction_id ?? event.id ?? `${appUserId}:${event.product_id}`);
  const periodEnd = event.expiration_at_ms ? new Date(event.expiration_at_ms) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { revenuecatSubscriptionId: subscriptionId },
    update: {
      productId: event.product_id ?? "unknown",
      status,
      platform: platformForStore(event.store),
      currentPeriodEnd: periodEnd
    },
    create: {
      userId: user.id,
      revenuecatSubscriptionId: subscriptionId,
      productId: event.product_id ?? "unknown",
      status,
      platform: platformForStore(event.store),
      currentPeriodEnd: periodEnd
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { tier: status === "ACTIVE" || status === "GRACE_PERIOD" ? "PREMIUM" : "FREE" }
  });

  return { ignored: false, userId: user.id, status };
}
