import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { getFarmContext, getLivestockContext } from "../services/farm-context-service.js";
import { routeAIRequest } from "../services/ai-router.js";
import type { AITask, FarmContext } from "../types/domain.js";

const router = Router();
router.use(authenticate);

function stripDataUrl(value?: string) {
  if (!value) return undefined;
  return value.includes(",") ? value.split(",").pop() : value;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function enforceChatQuota(user: AuthRequest["user"]) {
  if (user.tier === "PREMIUM") return { limit: null, used: 0, remaining: null };
  const used = await prisma.chatMessage.count({
    where: { userId: user.id, role: "USER", createdAt: { gte: startOfToday() } }
  });
  if (used >= 20) throw new AppError(402, "Free tier daily chat limit reached. Upgrade to Premium for unlimited messages.");
  return { limit: 20, used, remaining: 20 - used };
}

function baseContext(user: AuthRequest["user"]): FarmContext {
  return {
    userId: user.id,
    user: {
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      tier: user.tier
    }
  };
}

router.post(
  "/farming-recommendation",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ farmId: z.string().uuid(), focus: z.string().optional() }).parse(req.body);
    const context = await getFarmContext(req.user.id, body.farmId);
    const ai = await routeAIRequest(
      "farming_recommendation",
      `Generate a farm recommendation covering what to plant, how to plant, irrigation, fertilizer, pest risk, and the next 7 day action. Focus: ${body.focus ?? "full farm plan"}.`,
      context,
      undefined,
      req.user.id
    );

    const recommendation = await prisma.aiRecommendation.create({
      data: {
        farmId: body.farmId,
        type: "GENERAL",
        recommendation: ai.response,
        aiModelUsed: ai.modelUsed,
        contextSnapshot: context as any
      }
    });

    res.json({ recommendation, ai });
  })
);

router.post(
  "/livestock-diagnosis",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z
      .object({
        livestockId: z.string().uuid(),
        symptoms: z.string().min(5),
        affectedCount: z.coerce.number().int().positive().optional(),
        duration: z.string().optional(),
        imageBase64: z.string().optional(),
        saveEvent: z.boolean().default(true)
      })
      .parse(req.body);

    const context = await getLivestockContext(req.user.id, body.livestockId);
    const task: AITask = body.imageBase64 ? "image_animal_symptoms" : "livestock_diagnosis";
    const ai = await routeAIRequest(
      task,
      `Diagnose sick livestock. Symptoms: ${body.symptoms}. Affected animals: ${body.affectedCount ?? "unknown"}. Duration: ${body.duration ?? "unknown"}.`,
      context,
      stripDataUrl(body.imageBase64),
      req.user.id
    );

    const lower = ai.response.toLowerCase();
    const mustReportAuthorities = ["foot and mouth", "fmd", "anthrax", "african swine fever", "asf", "lumpy skin", "newcastle"].some((term) =>
      lower.includes(term)
    );
    const mustCallVet = mustReportAuthorities || lower.includes("emergency") || lower.includes("urgent");

    const healthEvent = body.saveEvent
      ? await prisma.healthEvent.create({
          data: {
            livestockId: body.livestockId,
            symptoms: body.symptoms,
            aiDiagnosis: ai.response,
            aiTreatment: ai.response,
            aiModelUsed: ai.modelUsed,
            mustCallVet,
            mustReportAuthorities
          }
        })
      : null;

    res.json({ ai, healthEvent, mustCallVet, mustReportAuthorities });
  })
);

router.post(
  "/analyze-image",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z
      .object({
        imageType: z.enum(["crop", "animal"]),
        imageBase64: z.string().min(20),
        farmId: z.string().uuid().optional(),
        livestockId: z.string().uuid().optional(),
        prompt: z.string().optional()
      })
      .parse(req.body);

    const context =
      body.imageType === "animal" && body.livestockId
        ? await getLivestockContext(req.user.id, body.livestockId)
        : body.farmId
          ? await getFarmContext(req.user.id, body.farmId)
          : baseContext(req.user);

    const task: AITask = body.imageType === "animal" ? "image_animal_symptoms" : "image_crop_disease";
    const ai = await routeAIRequest(
      task,
      body.prompt ?? "Analyze this uploaded photo and provide Botswana-specific next steps.",
      context,
      stripDataUrl(body.imageBase64),
      req.user.id
    );
    res.json({ ai });
  })
);

router.post(
  "/chat",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z
      .object({
        sessionId: z.string().optional(),
        farmId: z.string().uuid().optional(),
        livestockId: z.string().uuid().optional(),
        message: z.string().min(1),
        messageType: z.enum(["FARMING", "LIVESTOCK", "GENERAL"]).default("GENERAL"),
        imageBase64: z.string().optional()
      })
      .parse(req.body);

    const quota = await enforceChatQuota(req.user);
    const sessionId = body.sessionId ?? randomUUID();
    const context =
      body.livestockId && body.messageType === "LIVESTOCK"
        ? await getLivestockContext(req.user.id, body.livestockId)
        : body.farmId
          ? await getFarmContext(req.user.id, body.farmId)
          : baseContext(req.user);

    await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        farmId: body.farmId,
        livestockId: body.livestockId,
        sessionId,
        role: "USER",
        content: body.message,
        messageType: body.messageType
      }
    });

    const task: AITask = body.imageBase64
      ? body.messageType === "LIVESTOCK"
        ? "image_animal_symptoms"
        : "image_crop_disease"
      : body.messageType === "LIVESTOCK"
        ? "chat_livestock"
        : body.messageType === "FARMING"
          ? "chat_farming"
          : "quick_question";

    const ai = await routeAIRequest(task, body.message, context, stripDataUrl(body.imageBase64), req.user.id);
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        farmId: body.farmId,
        livestockId: body.livestockId,
        sessionId,
        role: "ASSISTANT",
        content: ai.response,
        aiModelUsed: ai.modelUsed,
        messageType: body.messageType
      }
    });

    if (req.query.stream === "true") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive"
      });
      for (const chunk of ai.response.match(/.{1,180}(\s|$)/g) ?? [ai.response]) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true, sessionId, ai, quota })}\n\n`);
      res.end();
      return;
    }

    res.json({ sessionId, message: assistantMessage, ai, quota });
  })
);

router.get(
  "/recommendations/:farmId",
  asyncHandler<AuthRequest>(async (req, res) => {
    await getFarmContext(req.user.id, req.params.farmId);
    const recommendations = await prisma.aiRecommendation.findMany({
      where: { farmId: req.params.farmId },
      orderBy: { createdAt: "desc" }
    });
    res.json({ recommendations });
  })
);

router.get(
  "/chat/history/:sessionId",
  asyncHandler<AuthRequest>(async (req, res) => {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id, sessionId: req.params.sessionId },
      orderBy: { createdAt: "asc" }
    });
    res.json({ messages });
  })
);

export default router;
