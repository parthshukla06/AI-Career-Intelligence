import dotenv from "dotenv";

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || "development";

export const validateEnvironment = (): void => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  if (NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes("change-me"))) {
    throw new Error("A strong JWT_SECRET is required in production");
  }
};

export const corsOrigins = (): true | string[] => {
  const configured = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);
  return configured?.length ? configured : NODE_ENV === "production" ? [] : true;
};
