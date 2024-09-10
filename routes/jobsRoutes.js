import { Router } from "express";

const router = Router();

import { getJobs, getJob, deleteJobs, deleteJob } from "../controllers/jobs.js";

router.route("/").get(getJobs).delete(deleteJobs);
router.route("/:jobId").get(getJob).delete(deleteJob);

export default router;
