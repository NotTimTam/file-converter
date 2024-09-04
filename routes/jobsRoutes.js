import { Router } from "express";

const router = Router();

import { getJobs, getJob } from "../controllers/jobs.js";

router.get("/", getJobs);
router.get("/:jobId", getJob);

export default router;
