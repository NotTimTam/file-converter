/**
 * HELP
 *
 * Method: GET
 *
 * Get assistance with API requests.
 */
export const help = (req, res) => {
	res.status(200).json({
		routes: [
			{
				route: "/mimetypes",
				method: "GET",
				description: "Get all valid file types.",
				queryParameters: [
					{
						parameter: "type",
						description: "Filter by mimetype type.",
						optional: true,
					},
				],
			},
			{
				route: "/mimetypes/validate",
				method: "GET",
				description: "Validate mimetype or file extension.",
				queryParameters: [
					{
						parameter: "value",
						description: "The value to validate.",
						optional: false,
					},
				],
			},
			{
				route: "/modules",
				method: "GET",
				description: "Get all file conversion modules.",
			},
			{
				route: "/convert",
				method: "POST",
				description: "Convert file(s) from one filetype to another.",
				body: {
					FormData: {
						files: "The file(s) to convert.",
						to: "A valid mimetype to convert the files to.",
					},
				},
			},
		],
	});
};
