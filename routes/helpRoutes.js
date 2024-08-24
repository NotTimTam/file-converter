import { Router } from "express";

const router = Router();

import { help } from "../controllers/help.js";

router.get("/", help);

export default router;
