/**
 * Types matching the backend auth endpoints exactly.
 *
 * POST /api/auth/register  → { name, email, password }
 * POST /api/auth/login     → { email, password }
 * GET  /api/auth/me        → User (no passwordHash)
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

// What the backend returns inside data on login/register
export interface AuthData {
  user: AuthUser;
  token: string;
}

// Request bodies
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
