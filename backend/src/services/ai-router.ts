import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { FARMING_SYSTEM_PROMPT } from "../prompts/farming.js";
import { LIVESTOCK_SYSTEM_PROMPT } from "../prompts/livestock.js";
import type { AIResult, AITask, FarmContext } from "../types/domain.js";

type ModelKey = "claude" | "gemini" | "gpt4o";
type ProviderResult = { response: string; tokensUsed: number; modelName: string };

const MODEL_NAMES: Record<ModelKey, string> = {
  claude: "claude-sonnet-4-20250514",
  gemini: "gemini-2.0-flash",
  gpt4o: "gpt-4o"
};

function systemPromptForTask(task: AITask) {
  if (task.includes("livestock") || task.includes("animal")) return LIVESTOCK_SYSTEM_PROMPT;
  return FARMING_SYSTEM_PROMPT;
}

function formatContext(context: FarmContext) {
  return `\n\nFARMER AND FARM CONTEXT JSON:\n${JSON.stringify(context, null, 2)}`;
}

function chainForTask(task: AITask): ModelKey[] {
  if (task === "quick_question" || task === "weather_interpretation") return ["gemini", "gpt4o", "claude"];
  if (task === "structured_data" || task === "fallback") return ["gpt4o", "claude", "gemini"];
  return ["claude", "gemini", "gpt4o"];
}

async function logUsage(
  userId: string | undefined,
  model: string,
  task: AITask,
  tokensUsed: number,
  latencyMs: number,
  success: boolean
) {
  if (!userId) return;
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        model,
        taskType: task,
        tokensUsed,
        latencyMs,
        success
      }
    });
  } catch (error) {
    console.warn("AI usage logging failed", error);
  }
}

async function callClaude(task: AITask, prompt: string, context: FarmContext): Promise<ProviderResult> {
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL_NAMES.claude,
      max_tokens: 1400,
      temperature: task === "structured_data" ? 0.1 : 0.4,
      system: systemPromptForTask(task),
      messages: [{ role: "user", content: `${prompt}${formatContext(context)}` }]
    })
  });
  if (!response.ok) throw new Error(`Claude failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const text = data.content?.map((part: any) => part.text).join("\n") ?? "";
  const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
  return { response: text, tokensUsed: tokens, modelName: MODEL_NAMES.claude };
}

async function callGemini(task: AITask, prompt: string, context: FarmContext, imageBase64?: string): Promise<ProviderResult> {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
  const parts: any[] = [{ text: `${systemPromptForTask(task)}\n\n${prompt}${formatContext(context)}` }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: "image/jpeg", data: imageBase64 } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAMES.gemini}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: task === "structured_data" ? 0.1 : 0.35,
          maxOutputTokens: 1400
        }
      })
    }
  );
  if (!response.ok) throw new Error(`Gemini failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.map((part: any) => part.text).filter(Boolean).join("\n") ??
    "No Gemini response text returned.";
  return { response: text, tokensUsed: data.usageMetadata?.totalTokenCount ?? 0, modelName: MODEL_NAMES.gemini };
}

async function callOpenAI(task: AITask, prompt: string, context: FarmContext, imageBase64?: string): Promise<ProviderResult> {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

  const userContent = imageBase64
    ? [
        { type: "text", text: `${prompt}${formatContext(context)}` },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    : `${prompt}${formatContext(context)}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL_NAMES.gpt4o,
      temperature: task === "structured_data" ? 0.1 : 0.35,
      response_format: task === "structured_data" ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: systemPromptForTask(task) },
        { role: "user", content: userContent }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return {
    response: data.choices?.[0]?.message?.content ?? "",
    tokensUsed: data.usage?.total_tokens ?? 0,
    modelName: MODEL_NAMES.gpt4o
  };
}

async function callModel(model: ModelKey, task: AITask, prompt: string, context: FarmContext, imageBase64?: string) {
  if (model === "claude") return callClaude(task, prompt, context);
  if (model === "gemini") return callGemini(task, prompt, context, imageBase64);
  return callOpenAI(task, prompt, context, imageBase64);
}

async function staleRecommendation(context: FarmContext, latencyMs: number): Promise<AIResult> {
  if (context.farmId) {
    const cached = await prisma.aiRecommendation.findFirst({
      where: { farmId: context.farmId },
      orderBy: { createdAt: "desc" }
    });
    if (cached) {
      return {
        response: `Stale recommendation shown because all AI providers are currently unavailable.\n\n${cached.recommendation}`,
        modelUsed: `cached:${cached.aiModelUsed}`,
        tokensUsed: 0,
        latencyMs,
        stale: true
      };
    }
  }

  return {
    response:
      "AI providers are currently unavailable and no cached recommendation exists yet. Check weather, isolate sick animals if relevant, and try again soon.",
    modelUsed: "unavailable",
    tokensUsed: 0,
    latencyMs,
    stale: true
  };
}

async function executeChain(
  task: AITask,
  prompt: string,
  context: FarmContext,
  models: ModelKey[],
  imageBase64?: string,
  userId?: string,
  startedAt = Date.now()
): Promise<AIResult> {
  for (const model of models) {
    const modelStart = Date.now();
    try {
      const result = await callModel(model, task, prompt, context, imageBase64);
      const latencyMs = Date.now() - modelStart;
      await logUsage(userId, result.modelName, task, result.tokensUsed, latencyMs, true);
      return {
        response: result.response,
        modelUsed: result.modelName,
        tokensUsed: result.tokensUsed,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      await logUsage(userId, MODEL_NAMES[model], task, 0, Date.now() - modelStart, false);
      console.warn(`AI provider ${MODEL_NAMES[model]} failed`, error);
    }
  }

  return staleRecommendation(context, Date.now() - startedAt);
}

export async function routeAIRequest(
  task: AITask,
  prompt: string,
  context: FarmContext,
  imageBase64?: string,
  userId?: string
): Promise<AIResult> {
  const startedAt = Date.now();

  if ((task === "image_crop_disease" || task === "image_animal_symptoms") && imageBase64) {
    let visionResult = "";
    let visionTokens = 0;
    const visionStart = Date.now();
    try {
      const geminiVision = await callGemini(task, "Analyze this image first. Identify visible symptoms, risk factors, and uncertainty.", context, imageBase64);
      visionResult = geminiVision.response;
      visionTokens = geminiVision.tokensUsed;
      await logUsage(userId, geminiVision.modelName, task, visionTokens, Date.now() - visionStart, true);
    } catch (error) {
      await logUsage(userId, MODEL_NAMES.gemini, task, 0, Date.now() - visionStart, false);
      console.warn("Gemini vision analysis failed", error);
    }

    const treatmentTask: AITask = task === "image_animal_symptoms" ? "livestock_diagnosis" : "farming_recommendation";
    const treatmentPrompt = `${prompt}\n\nVision analysis from image:\n${visionResult || "Vision analysis unavailable. Work from farmer description and state uncertainty."}\n\nGive a practical plan for Botswana conditions.`;
    const result = await executeChain(treatmentTask, treatmentPrompt, context, ["claude", "gpt4o", "gemini"], undefined, userId, startedAt);
    return {
      ...result,
      modelUsed: visionResult ? `${MODEL_NAMES.gemini} -> ${result.modelUsed}` : result.modelUsed,
      tokensUsed: result.tokensUsed + visionTokens
    };
  }

  return executeChain(task, prompt, context, chainForTask(task), imageBase64, userId, startedAt);
}
