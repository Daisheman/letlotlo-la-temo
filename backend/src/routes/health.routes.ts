import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { getLivestockContext } from "../services/farm-context-service.js";
import { routeAIRequest } from "../services/ai-router.js";

const router = Router({ mergeParams: true });
router.use(authenticate);

const healthSchema = z.object({
  symptoms: z.string().min(5),
  photoUrl: z.string().url().nullable().optional(),
  aiDiagnosis: z.string().nullable().optional(),
  aiTreatment: z.string().nullable().optional(),
  aiMedicines: z.string().nullable().optional(),
  aiModelUsed: z.string().nullable().optional(),
  mustCallVet: z.boolean().optional(),
  mustReportAuthorities: z.boolean().optional(),
  vetConfirmed: z.boolean().optional(),
  resolved: z.boolean().optional(),
  runAi: z.boolean().optional()
});

function flagsFromText(text: string) {
  const haystack = text.toLowerCase();
  const reportable = ["foot and mouth", "fmd", "anthrax", "african swine fever", "asf", "lumpy skin", "newcastle"].some((term) =>
    haystack.includes(term)
  );
  const emergency = reportable || ["sudden death", "bloody discharge", "cannot stand", "severe", "emergency"].some((term) => haystack.includes(term));
  return { mustCallVet: emergency, mustReportAuthorities: reportable };
}

async function assertLivestock(userId: string, livestockId: string) {
  const livestock = await prisma.livestock.findFirst({ where: { id: livestockId, farm: { userId } } });
  if (!livestock) throw new AppError(404, "Livestock group not found");
  return livestock;
}

router.get(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    await assertLivestock(req.user.id, req.params.livestockId);
    const healthEvents = await prisma.healthEvent.findMany({
      where: { livestockId: req.params.livestockId },
      orderBy: { reportedAt: "desc" }
    });
    res.json({ healthEvents });
  })
);

router.post(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    await assertLivestock(req.user.id, req.params.livestockId);
    const input = healthSchema.parse(req.body);
    let aiDiagnosis = input.aiDiagnosis;
    let aiTreatment = input.aiTreatment;
    let aiModelUsed = input.aiModelUsed;

    if (input.runAi) {
      const context = await getLivestockContext(req.user.id, req.params.livestockId);
      const ai = await routeAIRequest(
        "livestock_diagnosis",
        `Diagnose this livestock issue from farmer symptoms and give immediate actions, medicine guidance, and reporting guidance. Symptoms: ${input.symptoms}`,
        context,
        undefined,
        req.user.id
      );
      aiDiagnosis = ai.response;
      aiTreatment = ai.response;
      aiModelUsed = ai.modelUsed;
    }

    const inferred = flagsFromText(`${input.symptoms}\n${aiTreatment ?? ""}`);
    const event = await prisma.healthEvent.create({
      data: {
        livestockId: req.params.livestockId,
        symptoms: input.symptoms,
        photoUrl: input.photoUrl,
        aiDiagnosis,
        aiTreatment,
        aiMedicines: input.aiMedicines,
        aiModelUsed,
        mustCallVet: input.mustCallVet ?? inferred.mustCallVet,
        mustReportAuthorities: input.mustReportAuthorities ?? inferred.mustReportAuthorities,
        vetConfirmed: input.vetConfirmed ?? false,
        resolved: input.resolved ?? false
      }
    });
    res.status(201).json({ healthEvent: event });
  })
);

router.put(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await assertLivestock(req.user.id, req.params.livestockId);
    const existing = await prisma.healthEvent.findFirst({
      where: { id: req.params.id, livestockId: req.params.livestockId }
    });
    if (!existing) throw new AppError(404, "Health event not found");

    const input = healthSchema.partial().omit({ runAi: true }).parse(req.body);
    const healthEvent = await prisma.healthEvent.update({ where: { id: req.params.id }, data: input });
    res.json({ healthEvent });
  })
);

export default router;
