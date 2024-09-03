import fs from "fs-extra";
import { handleError } from "../util/errors.js";
import archiver from "archiver";

/**
 * CONVERT
 *
 * Method: POST
 *
 * Convert a file from one type to another.
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

		await moduleObject.convert(
			files,
			({ size }, { path, originalname }) => {
				fileConverter.stats.dataConverted += size / 1e6;
				fileConverter.stats.filesConverted++;
				zip.file(path, { name: originalname }); // Add the file to the zip.
			}
		); // Convert all files.

		await zip.finalize();

		await unlinkAndGo();
	} catch (err) {
		return await unlinkAndGo(() => handleError(res, err));
	}
};

export const convertOld = async (req, res) => {
	const {
		fileConverter: { modules },
		body: { module },
	} = req;

	let { files } = req;

	const unlinkAndGo = async (go) => {
		const { files } = req;

		if (files && files.files && files.files instanceof Array)
			for (const { path } of files.files) await fs.unlink(path);

		if (go) await go();
	};

	try {
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

		if (!files || !files.files)
			return await unlinkAndGo(() =>
				res.status(400).send("No 'files' array provided in request.")
			);

		files = files.files;

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

		try {
			await moduleObject.convert(files); // Convert all files.

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

			for (const { path, originalname } of files) {
				zip.file(path, { name: originalname });
			}

			await zip.finalize();

			await unlinkAndGo();
		} catch (err) {
			throw err;
		}
	} catch (err) {
		return await unlinkAndGo(() => handleError(res, err));
	}
};
