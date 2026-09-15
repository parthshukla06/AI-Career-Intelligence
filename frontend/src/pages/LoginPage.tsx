import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { login as loginApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Validation schema — mirrors backend: email valid, password 8-200 chars
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Demo credentials ──────────────────────────────────────────────────────────
// Read at module load time from Vite env vars (baked in at build time).
// Both must be non-empty strings for the demo button to be shown.
// Leave VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD unset in production to hide the button.
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

const demoAvailable =
  typeof DEMO_EMAIL === "string" &&
  DEMO_EMAIL.length > 0 &&
  typeof DEMO_PASSWORD === "string" &&
  DEMO_PASSWORD.length > 0;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [serverError, setServerError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // ── Existing form submit ────────────────────────────────────────────────────
  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const data = await loginApi(values);

      login(data.token, data.user);

      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);

      navigate(from, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message;

        if (error.response?.status === 401) {
          setServerError("Invalid email or password. Please try again.");
        } else if (error.response?.status === 429) {
          setServerError(
            "Too many attempts. Please wait a moment and try again.",
          );
        } else {
          setServerError(message ?? "Unable to sign in. Please try again.");
        }
      } else {
        setServerError("Unable to reach the server. Check your connection.");
      }
    }
  };

  // ── Demo login ──────────────────────────────────────────────────────────────
  const handleDemoLogin = async () => {
    if (!demoAvailable) return;

    setServerError(null);
    setDemoLoading(true);

    try {
      const data = await loginApi({
        email: DEMO_EMAIL as string,
        password: DEMO_PASSWORD as string,
      });

      login(data.token, data.user);

      toast.success(`Signed in as demo account (${data.user.name})`);

      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setServerError(
            'Demo account not found. Run "npm run seed:demo" in the backend directory, then try again.',
          );
        } else if (error.response?.status === 429) {
          setServerError(
            "Too many attempts. Please wait a moment and try again.",
          );
        } else {
          const message = (error.response?.data as { message?: string })?.message;

          setServerError(
            message ?? "Demo login failed. Please try again.",
          );
        }
      } else {
        setServerError("Unable to reach the server. Check your connection.");
      }
    } finally {
      setDemoLoading(false);
    }
  };

  const isAnyLoading = isSubmitting || demoLoading;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            AI
          </div>

          <CardTitle className="text-2xl">Sign in</CardTitle>

          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* Server-level error */}
            {serverError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isAnyLoading}
                {...register("email")}
              />

              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isAnyLoading}
                  className="pr-10"
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isAnyLoading}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isAnyLoading}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Sign in
            </Button>

            {/* Demo account button */}
            {demoAvailable && (
              <>
                <div className="flex w-full items-center gap-3">
                  <Separator className="flex-1" />

                  <span className="text-xs text-muted-foreground">
                    or
                  </span>

                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isAnyLoading}
                  onClick={handleDemoLogin}
                >
                  {demoLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FlaskConical className="mr-2 h-4 w-4" />
                  )}

                  Continue with Demo Account
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Demo account — for local development / testing only
                </p>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}