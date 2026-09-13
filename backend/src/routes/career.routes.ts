import { Router } from "express";
import {
  getCareerOverview,
  getExperienceRecommendations,
  getReadiness,
  getSkillDemand,
  getSkillGaps,
  getWhatIf,
} from "../controllers/career.controller";

const router = Router();

router.get("/skill-demand", getSkillDemand);
router.get("/what-if/:resumeId", getWhatIf);
router.get("/:resumeId/what-if", getWhatIf);
router.get("/:resumeId/skill-gaps", getSkillGaps);
router.get("/:resumeId/readiness", getReadiness);
router.get("/:resumeId/experience-recommendations", getExperienceRecommendations);
router.get("/:resumeId", getCareerOverview);

export default router;