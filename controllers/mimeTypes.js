import mime from "mime-types";
import { handleError } from "../util/errors.js";

/**
 * MIME TYPES
 *
 * Method: GET
 *
 * Get all valid mime types.
 *
 * req.query { type }
 */
export const getAllMimeTypes = (req, res) => {
	try {
		const { type } = req.query;

		let types = Object.keys(mime.extensions);

		if (type) {
			types = types.filter((_) => _.split("/")[0] === type);
		}

		res.status(200).json({
			mimeTypes: types,
		});
	} catch (err) {
		return handleError(res, err);
	}
};

/**
 * VALIDATE MIME TYPE
 *
 * Method: GET
 *
 * Validate a mimetype or file extension.
 *
 * req.query { value }
 */
export const validateMimeType = (req, res) => {
	try {
		const { value } = req.query;

		if (!value)
			return res.status(400).send("No 'value' query parameter provided.");
		if (typeof value !== "string")
			return res
				.status(400)
				.send("Invalid 'value' query parameter provided.");

		const sendObject = { valid: Object.values(mime.types).includes(value) };

		if (sendObject.valid) {
			sendObject.extension = mime.extension(value);
			sendObject.charset = mime.charset(value);
			sendObject.contentType = mime.contentType(value);
		}

		return res.status(200).send(sendObject);
	} catch (err) {
		return handleError(res, err);
	}
};
