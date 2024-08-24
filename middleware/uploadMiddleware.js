import multer from "multer";
import { handleError } from "../util/errors.js";
// const storage = multer.memoryStorage();

const uploadMiddleware = async (req, res, next) => {
	const { fileConverter } = req;

	try {
		if (!req.body)
			return res.status(400).send("No data provided in request body.");

		const multerConfig = {
			// storage,
			dest: "uploads/",
		};

		if (fileConverter.fileSizeLimit)
			multerConfig.limits = {
				fileSize: fileConverter.fileSizeLimit,
			};

		const upload = multer(multerConfig).fields([
			{ name: "files" },
			{ name: "module" },
		]);

		upload(req, res, (err) => {
			if (err instanceof multer.MulterError) {
				const { code, field } = err;

				const errorMessages = {
					LIMIT_PART_COUNT:
						"More form props & files provided than the permitted amount.",
					LIMIT_FILE_SIZE: `File size limits exceeded. Maximum file size is ${multerConfig.limits.fileSize} bytes.`,
					LIMIT_FILE_COUNT: "More files provided than allowed.",
					LIMIT_FIELD_KEY: "Field key too long.",
					LIMIT_FIELD_VALUE: "Field value too long.",
					LIMIT_FIELD_COUNT: "FormData field count limits exceeded.",
					LIMIT_UNEXPECTED_FILE: "Unexpected prop provided.",
					MISSING_FIELD_NAME: "Expected field name not provided.",
				};

				return res.status(400).send(errorMessages[code]);
			} else if (err) throw err;

			next();
		});
	} catch (err) {
		return handleError(res, err);
	}
};

export default uploadMiddleware;
