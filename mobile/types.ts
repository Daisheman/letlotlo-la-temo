export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationName?: string | null;
  tier: "FREE" | "PREMIUM";
  revenuecatUserId?: string | null;
  preferredLanguage: "EN" | "TN";
  pushToken?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  mfaEnabled?: boolean;
  mfaMethod?: "EMAIL" | "TOTP" | null;
};

export type CommunityPost = {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  status: string;
  photoUrls: string[];
  tags: string[];
  district?: string | null;
  isAnonymous: boolean;
  isPinned: boolean;
  isVerified: boolean;
  viewCount: number;
  createdAt: string;
  author?: { id: string; name: string; locationName?: string | null; reputation?: UserReputation | null };
  reactions?: unknown[];
  comments?: CommunityComment[];
  bookmarks?: unknown[];
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  photoUrls: string[];
  isAnonymous: boolean;
  isBestAnswer: boolean;
  parentId?: string | null;
  createdAt: string;
  author?: { id: string; name: string; reputation?: UserReputation | null };
  replies?: CommunityComment[];
  reactions?: unknown[];
};

export type UserReputation = {
  points: number;
  postCount: number;
  helpfulCount: number;
  bestAnswerCount: number;
  badge?: string | null;
  user?: { id: string; name: string; locationName?: string | null; createdAt?: string };
};

export type MarketPrice = {
  id: string;
  crop: string;
  pricePerKg: number;
  district: string;
  marketName?: string | null;
  createdAt: string;
};

export type Farm = {
  id: string;
  userId: string;
  name: string;
  sizeHectares: number;
  lat: number;
  lng: number;
  soilType?: string | null;
  soilPh?: number | null;
  soilOrganicCarbon?: number | null;
  soilClayPct?: number | null;
  soilSandPct?: number | null;
  waterSource: "BOREHOLE" | "RIVER" | "RAIN" | "MUNICIPAL" | "MIXED";
  boreholeDepthMeters?: number | null;
  farmHealthScore?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
  crops?: Crop[];
  livestock?: Livestock[];
  recommendations?: Recommendation[];
};

export type Crop = {
  id: string;
  farmId: string;
  name: string;
  variety?: string | null;
  plantedDate?: string | null;
  expectedHarvestDate?: string | null;
  areaHectares: number;
  status: "PLANNED" | "GROWING" | "HARVESTED" | "FAILED";
  yieldKg?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
};

export type Livestock = {
  id: string;
  farmId: string;
  species: string;
  breed?: string | null;
  count: number;
  notes?: string | null;
  healthEvents?: HealthEvent[];
};

export type HealthEvent = {
  id: string;
  livestockId: string;
  reportedAt: string;
  symptoms: string;
  aiDiagnosis?: string | null;
  aiTreatment?: string | null;
  aiMedicines?: string | null;
  aiModelUsed?: string | null;
  mustCallVet: boolean;
  mustReportAuthorities: boolean;
  resolved: boolean;
};

export type Recommendation = {
  id: string;
  farmId: string;
  type: string;
  recommendation: string;
  aiModelUsed: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  aiModelUsed?: string | null;
  messageType: "FARMING" | "LIVESTOCK" | "GENERAL";
  createdAt: string;
};
