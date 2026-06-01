import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { api, type LoginPayload, type RegisterPayload } from "../lib/api";
import type { User } from "../types/chat";

type AuthState = {
  token?: string;
  currentUser?: User;
  loading: boolean;
  error?: string;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  setCurrentUser: (user?: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      loading: false,

      login: async (payload) => {
        set({ loading: true, error: undefined });
        try {
          const response = await api.login(payload);
          set({ token: response.token, loading: false });
        } catch (error) {
          set({ loading: false, error: error instanceof Error ? error.message : "Login failed" });
          throw error;
        }
      },

      register: async (payload) => {
        set({ loading: true, error: undefined });
        try {
          await api.register(payload);
          set({ loading: false });
        } catch (error) {
          set({ loading: false, error: error instanceof Error ? error.message : "Registration failed" });
          throw error;
        }
      },

      setCurrentUser: (user) => set({ currentUser: user }),

      logout: () => set({ token: undefined, currentUser: undefined, error: undefined })
    }),
    {
      name: "chat-auth",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        token: state.token,
        currentUser: state.currentUser
      })
    }
  )
);

const memoryStorage = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage?.getItem(name) ?? memoryStorage.get(name) ?? null;
    } catch {
      return memoryStorage.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    memoryStorage.set(name, value);
    try {
      window.localStorage?.setItem(name, value);
    } catch {
      // In-app browser storage can be unavailable; memory storage keeps the session alive.
    }
  },
  removeItem: (name) => {
    memoryStorage.delete(name);
    try {
      window.localStorage?.removeItem(name);
    } catch {
      // Ignore unavailable storage.
    }
  }
};
