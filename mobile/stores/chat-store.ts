import { create } from "zustand";
import { cache } from "@/lib/storage";

export type QueuedChat = {
  id: string;
  message: string;
  messageType: "FARMING" | "LIVESTOCK" | "GENERAL";
  farmId?: string;
  livestockId?: string;
  imageBase64?: string;
  createdAt: string;
};

type ChatState = {
  queued: QueuedChat[];
  hydrate: () => void;
  enqueue: (message: QueuedChat) => void;
  remove: (id: string) => void;
};

function persist(queued: QueuedChat[]) {
  cache.set("queued-chat", JSON.stringify(queued));
}

export const useChatStore = create<ChatState>((set, get) => ({
  queued: [],
  hydrate: () => {
    const raw = cache.getString("queued-chat");
    set({ queued: raw ? JSON.parse(raw) : [] });
  },
  enqueue: (message) => {
    const queued = [...get().queued, message];
    persist(queued);
    set({ queued });
  },
  remove: (id) => {
    const queued = get().queued.filter((item) => item.id !== id);
    persist(queued);
    set({ queued });
  }
}));
