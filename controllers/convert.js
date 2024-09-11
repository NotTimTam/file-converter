import fs from "fs-extra";
import { handleError } from "../util/errors.js";
import archiver from "archiver";

/**
 * CONVERT
 *
 * Method: POST
 *
 * Convert files from one type to another.
 */
export const convert = async (req, res) => {
	const {
		fileConverter,
		fileConverter: { modules },
		body: { module, options },
	} = req;

	const unlinkAndGo = async (files, go) => {
		if (files && files.files && files.files instanceof Array)
			for (const { path } of files.files) await fs.unlink(path);

		if (go) await go();
	};

	try {
		if (!req.files)
			return await unlinkAndGo(req.files, () =>
				res
					.status(400)
					.send("No 'files' field provided in request FormData.")
			);

		const {
			files: { files }, // Multer stores all file fields in a "files" object, which is what cause the nesting.
		} = req;

		if (!module)
			return await unlinkAndGo(req.files, () =>
				res.status(400).send("No 'module' value provided in request.")
			);

		if (typeof module !== "string")
			return await unlinkAndGo(req.files, () =>
				res
					.status(400)
					.send(
						`Invalid 'module' value provided in request: "${module}".`
					)
			);

		const moduleObject = modules.find(({ label }) => label === module);

		if (!moduleObject)
			return await unlinkAndGo(req.files, () =>
				res
					.status(400)
					.send(
						`No file conversion module exists with label "${module}".`
					)
			);

		if (!files)
			return await unlinkAndGo(req.files, () =>
				res
					.status(400)
					.send("No 'files' field provided in request FormData.")
			);

		if (!(files instanceof Array))
			return await unlinkAndGo(req.files, () =>
				res
					.status(400)
					.send(
						"Invalid 'files' value provided in request. Expected a FormData field containing files."
					)
			);

		for (const { mimetype } of files)
			if (!moduleObject.convertsFrom(mimetype))
				return await unlinkAndGo(req.files, () =>
					res
						.status(400)
						.send(
							`This conversion module does not support mimetype: "${mimetype}". Supported mimetypes: ${moduleObject.from}`
						)
				);

		const parsedOptions = options && JSON.parse(options);

		if (parsedOptions) {
			for (const [option, value] of Object.entries(parsedOptions)) {
				const optionInModule = moduleObject.options.find(
					({ label }) => label === option
				);

				if (!optionInModule)
					return res
						.status(400)
						.send(
							`The "${moduleObject.label}" module does not have an option with label "${option}".`
						);

				try {
					await optionInModule.validateInput(value);
				} catch (err) {
					return res
						.status(400)
						.send(
							err instanceof Error
								? err.message
								: JSON.stringify(err)
						);
				}
			}
		}

		const job = fileConverter.createJob(files, moduleObject, parsedOptions);

		job.run(); // Start the job asynchronously without awaiting it.

		return res.status(200).send({ jobId: job._id });
	} catch (err) {
		return await unlinkAndGo(req.files, () => handleError(res, err));
	}
};

/**
 * DOWNLOAD
 *
 * Method: GET
 *
 * Get all converted files for a job.
 *
 * req.params { jobId }
 */
export const download = async (req, res) => {
	const {
		fileConverter,
		params: { jobId },
	} = req;

	try {
		if (!jobId)
			return res.status(400).send('No "jobId" param provided to route.');

		const job = fileConverter.__getJob(jobId);

		if (!job)
			return res.status(404).send(`No job found with ID "${jobId}".`);

		if (job.status.step !== "done")
			return res
				.status(503)
				.send("This conversion job is not finished. Try again later.");

		for (const { path } of job.files) {
			const exists = await fs.exists(path);

			if (!exists)
				return res
					.status(500)
					.send(
						"Attempted to zip and send files, but it appears a file was deleted before the zip was created."
					);
		}

		res.setHeader(
			"Content-Disposition",
			`attachment; filename=Converted_Files_${new Date()
				.toISOString()
				.replace(/:/g, "-")
				.replace("T", "@")}.zip`
		);
		res.setHeader("Content-Type", "application/zip");

		const zip = archiver("zip", { zlib: { level: 9 } });
		zip.pipe(res);

		for (const { path, originalname } of job.files) {
			zip.file(path, { name: originalname }); // Add the file to the zip.
		}

		await zip.finalize();

		if (fileConverter.clearJobOnDownload) {
			// Remove the files.
			for (const { path } of job.files) await fs.unlink(path);

			// Remove the job.
			fileConverter.jobs = fileConverter.jobs.filter(
				({ _id }) => _id !== jobId
			);
		}
	} catch (err) {
		return await handleError(res, err);
	}
};
