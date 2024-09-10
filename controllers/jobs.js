import fs from "fs-extra";

/**
 * GET JOBS
 *
 * Method: GET
 *
 * Get all active jobs.
 */
export const getJobs = async (req, res) => {
	res.status(200).json({
		jobs: req.fileConverter.jobs.map((job) => job.returnable),
	});
};

/**
 * GET JOB
 *
 * Method: GET
 *
 * Get an active job by its ID.
 *
 * req.params { jobId }
 */
export const getJob = async (req, res) => {
	const { jobId } = req.params;

	const job = req.fileConverter.jobs.find(({ _id }) => _id === jobId);

	if (!job) return res.status(404).send(`No job found with ID "${jobId}".`);

	res.status(200).json({ job: job.returnable });
};

/**
 * DELETE JOBS
 *
 * Method: DELETE
 *
 * Get all inactive jobs delete them and the files associated with them.
 */
export const deleteJobs = async (req, res) => {
	const { fileConverter } = req;

	let deletedJobs = [];

	for (const job of fileConverter.jobs) {
		if (job.status.step !== "done") continue;

		// Remove the files.
		for (const { path } of job.files) await fs.unlink(path);

		deletedJobs.push(job._id);
	}

	// Remove the finished jobs.
	fileConverter.jobs = fileConverter.jobs.filter(
		({ _id }) => !deletedJobs.includes(_id)
	);

	res.status(200).send(
		"Inactive jobs and their associated files were deleted."
	);
};

/**
 * DELETE JOB
 *
 * Method: DELETE
 *
 * Get an inactive job by its ID and delete it and the files associated with it.
 *
 * req.params { jobId }
 */
export const deleteJob = async (req, res) => {
	const { fileConverter } = req;
	const { jobId } = req.params;

	const job = req.fileConverter.jobs.find(({ _id }) => _id === jobId);

	if (!job) return res.status(200).send("Job and associated files deleted.");

	if (job.status.step !== "done")
		return res
			.status(503)
			.send("This conversion job is not finished. Try again later.");

	// Remove the files.
	for (const { path } of job.files) await fs.unlink(path);

	// Remove the job.
	fileConverter.jobs = fileConverter.jobs.filter(({ _id }) => _id !== jobId);

	res.status(200).send("Job and associated files deleted.");
};
