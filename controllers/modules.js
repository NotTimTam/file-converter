import { handleError } from "../util/errors.js";

/**
 * GET ALL
 *
 * Method: GET
 *
 * Get all loaded modules.
 */
export const getAll = (req, res) => {
	try {
		const {
			fileConverter: { modules },
		} = req;

		res.status(200).json({ modules });
	} catch (err) {
		return handleError(res, err);
	}
};
