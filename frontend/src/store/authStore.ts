import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "aci_token";
const RESUME_ID_KEY = "aci_resume_id";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  resumeId: string | null;

  // Actions
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setResumeId: (resumeId: string | null) => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      resumeId: null,

      login: (token, user) => set({ token, user }),

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(RESUME_ID_KEY);
        set({ token: null, user: null, resumeId: null });
      },

      setResumeId: (resumeId) => set({ resumeId }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "aci_auth",
      // Only persist these three fields
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        resumeId: state.resumeId,
      }),
    },
  ),
);
