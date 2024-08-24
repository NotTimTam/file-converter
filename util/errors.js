/**
 * Handle uncaught errors.
 * @param {Express.res} res The express event's res object.
 * @param {*} error The error that occured.
 */
export const handleError = (res, error) => {
	console.error(error);
	return res
		.status(500)
		.send(
			"Unknown server-side error occured. Please try again later or reformat your request."
		);
};
