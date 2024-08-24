import { Router } from "express";

const router = Router();

import { convert } from "../controllers/convert.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";

router.get("/", uploadMiddleware, convert);

export default router;
