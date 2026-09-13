import { Router } from "express";
import { careerPaths, chat, roadmap, resumeImprovement } from "../controllers/careerAssistant.controller";

const router = Router();

router.post("/chat", chat);
router.get("/roadmap/:resumeId", roadmap);
router.post("/resume-improvement/:resumeId", resumeImprovement);
router.get("/career-paths/:resumeId", careerPaths);

export default router;
