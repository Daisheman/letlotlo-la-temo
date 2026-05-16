import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";

const expo = new Expo(env.EXPO_ACCESS_TOKEN ? { accessToken: env.EXPO_ACCESS_TOKEN } : undefined);

export async function registerPushToken(userId: string, pushToken: string) {
  if (!Expo.isExpoPushToken(pushToken)) throw new AppError(400, "Invalid Expo push token");
  return prisma.user.update({
    where: { id: userId },
    data: { pushToken },
    select: { id: true, pushToken: true }
  });
}

export async function sendPushMessages(messages: ExpoPushMessage[]) {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    tickets.push(...(await expo.sendPushNotificationsAsync(chunk)));
  }
  return tickets;
}

export async function sendToUsers(userIds: string[], title: string, body: string, data: Record<string, unknown> = {}) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, pushToken: { not: null } },
    select: { pushToken: true }
  });
  const messages = users
    .map((user) => user.pushToken)
    .filter((token): token is string => Boolean(token) && Expo.isExpoPushToken(token))
    .map((to) => ({ to, title, body, data, sound: "default" as const }));
  return sendPushMessages(messages);
}
