import { Router } from "express";

const router = Router();

import { getAllMimeTypes, validateMimeType } from "../controllers/mimeTypes.js";

router.get("/", getAllMimeTypes);
router.get("/validate", validateMimeType);

export default router;
