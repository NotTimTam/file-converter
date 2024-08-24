import { handleError } from "../util/errors.js";
import mime from "mime-types";

/**
 * CONVERT
 *
 * Method: POST
 *
 * Convert a file from one type to another.
 */
export const convert = (req, res) => {
	const {
		fileConverter: { modules },
		files: { files },
		body: { module },
	} = req;

	try {
		if (!module)
			return res
				.status(400)
				.send("No 'module' value provided in request.");

		if (typeof module !== "string")
			return res
				.status(400)
				.send(
					`Invalid 'module' value provided in request: "${module}".`
				);

		const moduleObject = modules.find(({ label }) => label === module);

		if (!moduleObject)
			return res
				.status(400)
				.send(
					`No file conversion module exists with label "${module}".`
				);

		if (!files)
			return res
				.status(400)
				.send("No 'files' array provided in request.");

		if (!(files instanceof Array))
			return res
				.status(400)
				.send(
					"Invalid 'files' value provided in request. Expected a FormData field containing files."
				);

		// console.log(files);

		res.status(200).json(files);
	} catch (err) {
		return handleError(res, err);
	}
};
