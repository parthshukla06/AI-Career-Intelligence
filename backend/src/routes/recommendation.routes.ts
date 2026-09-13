import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { personalized } from "../controllers/user.controller";
import { getRecommendations } from "../controllers/recommendation.controller";

const router = Router();

router.get("/personalized/:resumeId", requireAuth, personalized);
router.get("/:resumeId", getRecommendations);

export default router;