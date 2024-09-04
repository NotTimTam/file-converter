import { Router } from "express";

const router = Router();

import { convert, download } from "../controllers/convert.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";

router.post("/", uploadMiddleware, convert);
router.get("/download/:jobId", download);

export default router;
