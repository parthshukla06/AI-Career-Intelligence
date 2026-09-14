import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { getMe } from "@/api/auth";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ResumePage } from "@/pages/ResumePage";
import { JobsPage } from "@/pages/JobsPage";
import { JobDetailPage } from "@/pages/JobDetailPage";
import { RecommendationsPage } from "@/pages/RecommendationsPage";
import { RoadmapPage } from "@/pages/RoadmapPage";
import { CareerPathsPage } from "@/pages/CareerPathsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ResumeImprovementPage } from "@/pages/ResumeImprovementPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { CareerPage } from "@/pages/CareerPage";

/**
 * AuthInitializer: on first mount, if a token exists in the store,
 * call GET /api/auth/me to verify it is still valid.
 * - On success: refresh user object in store.
 * - On 401: the Axios interceptor clears the store automatically.
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { token, setUser } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    getMe()
      .then((user) => {
        setUser(user);
      })
      .catch(() => {
        // 401 is handled by the Axios interceptor (clears auth store).
        // Other errors: silently continue ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â the token may still be usable.
      })
      .finally(() => {
        setReady(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  if (!ready) {
    // Minimal full-screen loader while rehydrating
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm animate-pulse">
            AI
          </div>
          <p className="text-sm text-muted-foreground">LoadingÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            {/* Public routes - no AppShell */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* App routes - shared shell */}
            <Route element={<AppShell />}>
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route
                path="/recommendations"
                element={<RecommendationsPage />}
              />
              <Route path="/career" element={<CareerPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/career-paths" element={<CareerPathsPage />} />
              <Route
                path="/resume-improvement"
                element={<ResumeImprovementPage />}
              />

              {/* Auth-protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>

      {/* Global toast notifications */}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}

















