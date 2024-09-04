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
		body: { module },
	} = req;

	const unlinkAndGo = async (go) => {
		const { files } = req;

		if (files && files.files && files.files instanceof Array)
			for (const { path } of files.files) await fs.unlink(path);

		if (go) await go();
	};

	try {
		if (!req.files)
			return await unlinkAndGo(() =>
				res
					.status(400)
					.send("No 'files' field provided in request FormData.")
			);

		const {
			files: { files }, // Multer stores all file fields in a "files" object, which is what cause the nesting.
		} = req;

		if (!module)
			return await unlinkAndGo(() =>
				res.status(400).send("No 'module' value provided in request.")
			);

		if (typeof module !== "string")
			return await unlinkAndGo(() =>
				res
					.status(400)
					.send(
						`Invalid 'module' value provided in request: "${module}".`
					)
			);

		const moduleObject = modules.find(({ label }) => label === module);

		if (!moduleObject)
			return await unlinkAndGo(() =>
				res
					.status(400)
					.send(
						`No file conversion module exists with label "${module}".`
					)
			);

		if (!files)
			return await unlinkAndGo(() =>
				res
					.status(400)
					.send("No 'files' field provided in request FormData.")
			);

		if (!(files instanceof Array))
			return await unlinkAndGo(() =>
				res
					.status(400)
					.send(
						"Invalid 'files' value provided in request. Expected a FormData field containing files."
					)
			);

		for (const { mimetype } of files)
			if (!moduleObject.convertsFrom(mimetype))
				return await unlinkAndGo(() =>
					res
						.status(400)
						.send(
							`This conversion module does not support mimetype: "${mimetype}". Supported mimetypes: ${moduleObject.from}`
						)
				);

		// res.setHeader(
		// 	"Content-Disposition",
		// 	`attachment; filename=Converted_Files_${new Date()
		// 		.toISOString()
		// 		.replace(/:/g, "-")
		// 		.replace("T", "@")}.zip`
		// );
		// res.setHeader("Content-Type", "application/zip");

		// const zip = archiver("zip", { zlib: { level: 9 } });
		// zip.pipe(res);

		res.setHeader("Content-Type", "application/json");

		const job = fileConverter.__createJob(files, moduleObject);

		await job.run((status) => {
			res.write(JSON.stringify({ ...status, jobId: job._id }));
		});

		res.end();

		// return res.status(200).send({ jobId: job._id });

		// await moduleObject.convert(
		// 	files,
		// 	({ size }, { path, originalname }) => {
		// 		fileConverter.stats.dataConverted += size / 1e6;
		// 		fileConverter.stats.filesConverted++;
		// 		zip.file(path, { name: originalname }); // Add the file to the zip.
		// 	}
		// ); // Convert all files.

		// await zip.finalize();

		// await unlinkAndGo();
	} catch (err) {
		return await unlinkAndGo(() => handleError(res, err));
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

		if (!job.status.step === "done")
			return res
				.status(503)
				.send("This conversion job is not finished. Try again later.");

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

		for (const { path } of job.files) await fs.unlink(path);

		fileConverter.jobs = fileConverter.jobs.filter(
			({ _id }) => _id !== jobId
		); // Remove the job.
	} catch (err) {
		return await unlinkAndGo(() => handleError(res, err));
	}
};
