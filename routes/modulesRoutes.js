import { Router } from "express";

const router = Router();

import { getAll } from "../controllers/modules.js";

router.get("/", getAll);

export default router;
