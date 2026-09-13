import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { getResumeById, uploadResume } from "../controllers/resume.controller";

const router = Router();
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      callback(null, true);
      return;
    }
    callback(new Error("Only PDF files are accepted"));
  },
});

const uploadSingleResume = (req: Request, res: Response, next: NextFunction): void => {
  upload.single("resume")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ success: false, message: "Resume must be 5 MB or smaller" });
      return;
    }

    const message = error instanceof Error ? error.message : "Unable to upload resume";
    res.status(400).json({ success: false, message });
  });
};

router.post("/upload", uploadSingleResume, uploadResume);
router.get("/:id", getResumeById);

export default router;
