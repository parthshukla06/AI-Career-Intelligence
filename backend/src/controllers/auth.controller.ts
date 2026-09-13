import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const issueToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({}, secret, { subject: userId, expiresIn: "7d" });
};

const publicUser = (user: { _id: unknown; name: string; email: string }) => ({ id: String(user._id), name: user.name, email: user.email });

export const register = async (req: Request, res: Response): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!name || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 200) {
    res.status(400).json({ success: false, message: "name, valid email, and password of 8-200 characters are required" });
    return;
  }
  try {
    if (await User.exists({ email })) {
      res.status(409).json({ success: false, message: "An account with that email already exists" });
      return;
    }
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ success: true, data: { user: publicUser(user), token: issueToken(String(user._id)) } });
  } catch (error) {
    console.error("User registration failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    res.status(500).json({ success: false, message: "Unable to create account" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }
    res.status(200).json({ success: true, data: { user: publicUser(user), token: issueToken(String(user._id)) } });
  } catch (error) {
    console.error("User login failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    res.status(500).json({ success: false, message: "Unable to sign in" });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Failed to fetch current user", { errorType: error instanceof Error ? error.name : "UnknownError" });
    res.status(500).json({ success: false, message: "Unable to fetch profile" });
  }
};
