import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { AuthData, AuthUser, LoginRequest, RegisterRequest } from "@/types/auth";

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns: { success, data: { user, token } }
 */
export async function register(body: RegisterRequest): Promise<AuthData> {
  const { data } = await apiClient.post<ApiResponse<AuthData>>(
    "/api/auth/register",
    body,
  );
  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Registration failed");
  }
  return data.data;
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, data: { user, token } }
 */
export async function login(body: LoginRequest): Promise<AuthData> {
  const { data } = await apiClient.post<ApiResponse<AuthData>>(
    "/api/auth/login",
    body,
  );
  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Login failed");
  }
  return data.data;
}

/**
 * GET /api/auth/me
 * Requires: Authorization: Bearer <token>
 * Returns: { success, data: User }
 */
export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiResponse<AuthUser>>("/api/auth/me");
  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Unable to fetch profile");
  }
  return data.data;
}
