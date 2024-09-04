/**
 * GET JOBS
 *
 * Method: GET
 *
 * Get all active jobs.
 */
export const getJobs = (req, res) => {
	res.status(200).json({
		jobs: req.fileConverter.jobs.map((job) => job.returnable),
	});
};

/**
 * GET JOBS
 *
 * Method: GET
 *
 * Get an active jobs by its ID.
 *
 * req.params { jobId }
 */
export const getJob = (req, res) => {
	const { jobId } = req.params;

	const job = req.fileConverter.jobs.find(({ _id }) => _id === jobId);

	if (!job) return res.status(404).send(`No job found with ID "${jobId}".`);

	res.status(200).json({ job: job.returnable });
};
