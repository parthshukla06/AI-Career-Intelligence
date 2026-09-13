import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request { userId?: string; }

declare global { namespace Express { interface Request { userId?: string; } } }

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (typeof payload.sub !== "string") throw new Error("Invalid token subject");
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid authentication token" });
  }
};
