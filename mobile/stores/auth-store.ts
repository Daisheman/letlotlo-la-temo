import { create } from "zustand";
import type { User } from "@/types";
import { getProfile } from "@/lib/queries";
import { getSecureItem, secureKeys, setSecureItem } from "@/lib/storage";
import * as authApi from "@/lib/api";

type AuthState = {
  user: User | null;
  language: "EN" | "TN";
  isBootstrapped: boolean;
  setUser: (user: User | null) => void;
  setLanguage: (language: "EN" | "TN") => void;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string; phone?: string; preferredLanguage: "EN" | "TN" }) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  verifyMfa: (input: { mfaToken: string; code: string; rememberDevice?: boolean; deviceFingerprint?: string; deviceName?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  language: "EN",
  isBootstrapped: false,
  setUser: (user) => set({ user, language: user?.preferredLanguage ?? get().language }),
  setLanguage: (language) => set({ language }),
  bootstrap: async () => {
    const token = await getSecureItem(secureKeys.accessToken);
    if (!token) {
      set({ isBootstrapped: true });
      return;
    }
    try {
      const user = await getProfile();
      set({ user, language: user.preferredLanguage, isBootstrapped: true });
    } catch {
      await setSecureItem(secureKeys.accessToken, null);
      await setSecureItem(secureKeys.refreshToken, null);
      set({ user: null, isBootstrapped: true });
    }
  },
  login: async (email, password) => {
    const user = await authApi.login(email, password);
    set({ user, language: user.preferredLanguage });
  },
  register: async (input) => {
    const user = await authApi.register(input);
    set({ user, language: user.preferredLanguage });
  },
  verifyEmail: async (email, code) => {
    const user = await authApi.verifyEmail(email, code);
    set({ user, language: user.preferredLanguage });
  },
  verifyMfa: async (input) => {
    const user = await authApi.verifyMfa(input);
    set({ user, language: user.preferredLanguage });
  },
  logout: async () => {
    await authApi.logout();
    set({ user: null });
  }
}));
