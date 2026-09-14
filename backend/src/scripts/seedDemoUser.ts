/**
 * seed:demo — creates a demo user for local development.
 *
 * Safety rules enforced before any DB operation:
 *   1. NODE_ENV must be "development" — refuses to run in production.
 *   2. DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME must all be set in .env.
 *
 * Idempotency:
 *   Uses findOneAndUpdate with $setOnInsert — if a user with DEMO_EMAIL
 *   already exists, the document is NOT modified (password is not reset).
 *   Running this script multiple times is safe.
 *
 * Run:  npm run seed:demo   (from the backend/ directory)
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../models/User";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

const seedDemoUser = async (): Promise<void> => {
  // ── Production guard ────────────────────────────────────────────────────────
  if (NODE_ENV !== "development") {
    console.error(
      "seed:demo refused — this script must only run in NODE_ENV=development.",
    );
    process.exit(1);
  }

  // ── Credential validation ───────────────────────────────────────────────────
  const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
  const demoPassword = process.env.DEMO_PASSWORD;
  const demoName = process.env.DEMO_NAME?.trim() || "Demo User";

  if (!demoEmail || !demoPassword) {
    console.error(
      "seed:demo refused — DEMO_EMAIL and DEMO_PASSWORD must be set in backend/.env",
    );
    process.exit(1);
  }

  if (demoPassword.length < 8) {
    console.error(
      "seed:demo refused — DEMO_PASSWORD must be at least 8 characters.",
    );
    process.exit(1);
  }

  // ── Connect and seed ────────────────────────────────────────────────────────
  try {
    await connectDB();

    const passwordHash = await bcrypt.hash(demoPassword, 12);

    // $setOnInsert: only sets fields when the document is being INSERTED (upsert).
    // If the user already exists, nothing is written — fully idempotent.
    const result = await User.findOneAndUpdate(
      { email: demoEmail },
      {
        $setOnInsert: {
          name: demoName,
          email: demoEmail,
          passwordHash,
        },
      },
      {
        upsert: true,
        returnDocument: "before", // returns null when a new doc is inserted
        includeResultMetadata: true,
      },
    );

    // When returnDocument:"before" and the doc was just inserted, value is null
    const wasInserted = result?.lastErrorObject?.upserted !== undefined;

    if (wasInserted) {
      console.log(`Demo user created: ${demoEmail} (${demoName})`);
    } else {
      console.log(
        `Demo user already exists — not modified: ${demoEmail}`,
      );
    }
  } catch (error) {
    console.error("seed:demo failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
};

seedDemoUser();
