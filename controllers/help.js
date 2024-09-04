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
				response: {
					mimeTypes: "An array of valid mimetypes.",
				},
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
				response: {
					valid: "A boolean indicating if the mimetype is valid.",
					extension:
						"The file extension for this mimetype. (if valid)",
					charset: "The charset for this mimetype. (if valid)",
					contentType:
						"The content type of this mimetype. (if valid)",
				},
			},
			{
				route: "/modules",
				method: "GET",
				description: "Get all file conversion modules.",
				response: {
					modules: "An array of module information.",
				},
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
				response:
					"A data stream indicating the conversion status and the ID of the job to later download the data.",
			},
			{
				route: "/convert/download/:jobId",
				method: "GET",
				description: "Get converted files from a job.",
				response:
					'A data stream that should be downloaded as a ".zip" file.',
			},
			{
				route: "/jobs",
				method: "GET",
				description: "Get all active jobs.",
				response: {
					jobs: "An array of the active jobs.",
				},
			},
			{
				route: "/jobs/:jobId",
				method: "GET",
				description: "Get an active job by its ID.",
				response: {
					job: "An object of the active job.",
				},
			},
			{
				route: "/stats",
				method: "GET",
				description: "Get file conversion statistics.",
				response: {
					initialization:
						"When this file converter instance was initialized, in number of milliseconds elapsed since the epoch.",
					filesConverted:
						"The number of files that have been converted since the converter was initialized",
					dataConverted:
						"The total amount of data that has been converted since the converter was initialized, in megabytes.",
				},
			},
		],
	});
};
