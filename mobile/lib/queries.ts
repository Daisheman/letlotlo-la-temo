import { api } from "./api";
import type { ChatMessage, CommunityPost, Crop, Farm, HealthEvent, Livestock, MarketPrice, Recommendation, User, UserReputation } from "@/types";

export async function getProfile() {
  const { data } = await api.get("/profile");
  return data.user as User;
}

export async function updateProfile(input: Partial<User>) {
  const { data } = await api.put("/profile", input);
  return data.user as User;
}

export async function getFarms() {
  const { data } = await api.get("/farms");
  return data.farms as Farm[];
}

export async function getFarm(id: string) {
  const { data } = await api.get(`/farms/${id}`);
  return data.farm as Farm;
}

export async function createFarm(input: Partial<Farm>) {
  const { data } = await api.post("/farms", input);
  return data.farm as Farm;
}

export async function getFarmHealthScore(farmId: string) {
  const { data } = await api.get(`/farms/${farmId}/health-score`);
  return data.farmHealthScore as number;
}

export async function getCrops(farmId: string) {
  const { data } = await api.get(`/farms/${farmId}/crops`);
  return data.crops as Crop[];
}

export async function createCrop(farmId: string, input: Partial<Crop>) {
  const { data } = await api.post(`/farms/${farmId}/crops`, input);
  return data.crop as Crop;
}

export async function getLivestock(farmId: string) {
  const { data } = await api.get(`/farms/${farmId}/livestock`);
  return data.livestock as Livestock[];
}

export async function createLivestock(farmId: string, input: Partial<Livestock>) {
  const { data } = await api.post(`/farms/${farmId}/livestock`, input);
  return data.livestock as Livestock;
}

export async function getHealthEvents(livestockId: string) {
  const { data } = await api.get(`/livestock/${livestockId}/health`);
  return data.healthEvents as HealthEvent[];
}

export async function createHealthEvent(livestockId: string, input: { symptoms: string; runAi?: boolean }) {
  const { data } = await api.post(`/livestock/${livestockId}/health`, input);
  return data.healthEvent as HealthEvent;
}

export async function getWeather(lat: number, lng: number, days = 14) {
  const { data } = await api.get("/weather/forecast", { params: { lat, lng, days } });
  return data.weather;
}

export async function getCurrentWeather(lat: number, lng: number) {
  const { data } = await api.get("/weather/current", { params: { lat, lng } });
  return data.weather;
}

export async function getSoil(lat: number, lng: number) {
  const { data } = await api.get("/soil", { params: { lat, lng } });
  return data.soil;
}

export async function getWater(lat: number, lng: number) {
  const { data } = await api.get("/water", { params: { lat, lng } });
  return data.waterSources;
}

export async function getRecommendation(farmId: string, focus?: string) {
  const { data } = await api.post("/ai/farming-recommendation", { farmId, focus });
  return data.recommendation as Recommendation;
}

export async function sendChat(input: {
  sessionId?: string;
  farmId?: string;
  livestockId?: string;
  message: string;
  messageType: "FARMING" | "LIVESTOCK" | "GENERAL";
  imageBase64?: string;
}) {
  const { data } = await api.post("/ai/chat", input);
  return data as { sessionId: string; message: ChatMessage; ai: { modelUsed: string }; quota: unknown };
}

export async function getChatHistory(sessionId: string) {
  const { data } = await api.get(`/ai/chat/history/${sessionId}`);
  return data.messages as ChatMessage[];
}

export async function analyzeLivestock(input: {
  livestockId: string;
  symptoms: string;
  affectedCount?: number;
  duration?: string;
  imageBase64?: string;
}) {
  const { data } = await api.post("/ai/livestock-diagnosis", { ...input, saveEvent: true });
  return data as { ai: { response: string; modelUsed: string }; healthEvent?: HealthEvent };
}

export async function getCommunityPosts(params: { category?: string; district?: string; search?: string } = {}) {
  const { data } = await api.get("/community/posts", { params });
  return data.posts as CommunityPost[];
}

export async function getTrendingPosts() {
  const { data } = await api.get("/community/posts/trending");
  return data.posts as CommunityPost[];
}

export async function getCommunityPost(id: string) {
  const { data } = await api.get(`/community/posts/${id}`);
  return data.post as CommunityPost;
}

export async function createCommunityPost(input: Partial<CommunityPost>) {
  const { data } = await api.post("/community/posts", input);
  return data.post as CommunityPost;
}

export async function addCommunityComment(postId: string, content: string, parentId?: string) {
  const { data } = await api.post(`/community/posts/${postId}/comments`, { content, parentId });
  return data.comment;
}

export async function reactCommunity(targetId: string, targetType: "post" | "comment", type: "HELPFUL" | "LEARNED" | "THANKS") {
  const { data } = await api.post("/community/react", { targetId, targetType, type });
  return data.reaction;
}

export async function toggleBookmark(postId: string) {
  const { data } = await api.post(`/community/bookmarks/${postId}`);
  return data as { bookmarked: boolean };
}

export async function getMarketPrices(params: { crop?: string; district?: string } = {}) {
  const { data } = await api.get("/community/market-prices", { params });
  return data.prices as MarketPrice[];
}

export async function reportMarketPrice(input: { crop: string; pricePerKg: number; district: string; marketName?: string }) {
  const { data } = await api.post("/community/market-prices", input);
  return data.price as MarketPrice;
}

export async function getMarketTrends(params: { crop?: string; district?: string } = {}) {
  const { data } = await api.get("/community/market-prices/trends", { params });
  return data.trends as MarketPrice[];
}

export async function getReputation(userId: string) {
  const { data } = await api.get(`/community/reputation/${userId}`);
  return data as { reputation: UserReputation | null; posts: CommunityPost[] };
}
