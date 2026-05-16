export type AITask =
  | "farming_recommendation"
  | "livestock_diagnosis"
  | "chat_farming"
  | "chat_livestock"
  | "image_crop_disease"
  | "image_animal_symptoms"
  | "quick_question"
  | "structured_data"
  | "weather_interpretation"
  | "fallback";

export type FarmContext = {
  farmId?: string;
  userId?: string;
  user?: {
    name: string;
    preferredLanguage: "EN" | "TN";
    tier: "FREE" | "PREMIUM";
    locationName?: string;
  };
  farm?: {
    name: string;
    sizeHectares: number;
    lat: number;
    lng: number;
    soilType?: string | null;
    soilPh?: number | null;
    soilOrganicCarbon?: number | null;
    soilClayPct?: number | null;
    soilSandPct?: number | null;
    waterSource?: string;
    boreholeDepthMeters?: number | null;
    farmHealthScore?: number | null;
    notes?: string | null;
  };
  crops?: Array<{
    name: string;
    variety?: string | null;
    status: string;
    plantedDate?: Date | string | null;
    expectedHarvestDate?: Date | string | null;
    areaHectares: number;
    yieldKg?: number | null;
    notes?: string | null;
  }>;
  livestock?: Array<{
    id?: string;
    species: string;
    breed?: string | null;
    count: number;
    notes?: string | null;
  }>;
  weather?: unknown;
  soil?: unknown;
  waterSources?: unknown;
  extra?: Record<string, unknown>;
};

export type AIResult = {
  response: string;
  modelUsed: string;
  tokensUsed: number;
  latencyMs: number;
  stale?: boolean;
};
