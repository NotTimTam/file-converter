import mime from "mime-types";

export default class Module {
	/**
	 * A file conversion module.
	 * @param {*} config The module's configuration object.
	 * @param {string|Array<string>} config.from The mimetype to convert from. Can be an array of supported mimetypes.
	 * @param {string|Array<string>} config.to The mimetype to convert to. Can be an array of supported mimetypes.
	 * @param {function} config.method An asynchronous callback, that accepts a file object, and converts that files content.
	 * @param {string} config.label A unique label for this module.
	 * @param {string} config.description Optional detailed description for module.
	 */
	constructor(
		config = {
			method: async (_) => _,
		}
	) {
		if (!config)
			throw new Error("No config provided to Module constructor.");

		const { from, to, method, label, description } = config;

		if (!from)
			throw new Error(
				"No 'from' value provided to Module constructor config."
			);

		if (from instanceof Array)
			for (const mimetype of from) {
				if (
					typeof mimetype !== "string" ||
					!Object.values(mime.types).includes(mimetype)
				)
					throw new SyntaxError(
						"Invalid 'from' value provided to Module constructor config. Expected a valid MIME type, file extension, or array of those values."
					);
			}
		else if (
			typeof from !== "string" ||
			(typeof from === "string" &&
				!Object.values(mime.types).includes(from))
		)
			throw new SyntaxError(
				"Invalid 'from' value provided to Module constructor config. Expected a valid MIME type, file extension, or array of those values."
			);

		if (!to)
			throw new Error(
				"No 'to' value provided to Module constructor config."
			);

		if (to instanceof Array)
			for (const mimetype of to) {
				if (
					typeof mimetype !== "string" ||
					!Object.values(mime.types).includes(mimetype)
				)
					throw new SyntaxError(
						"Invalid 'to' value provided to Module constructor config. Expected a valid MIME type, file extension, or array of those values."
					);
			}
		else if (
			typeof to !== "string" ||
			(typeof to === "string" && !Object.values(mime.types).includes(to))
		)
			throw new SyntaxError(
				"Invalid 'to' value provided to Module constructor config. Expected a valid MIME type, file extension, or array of those values."
			);

		if (!method || typeof method !== "function")
			throw new SyntaxError(
				`Expected an asynchronous callback function for Module constructor config.method value.`
			);

		if (!label || typeof label !== "string")
			throw new SyntaxError(
				`Expected a string value for Module constructor config.label.`
			);
		if (label.length > 64)
			throw new SyntaxError(
				"Module labels cannot be longer than 32 characters."
			);

		if (description) {
			if (typeof description !== "string")
				throw new SyntaxError(
					`Expected a string value for Module constructor config.description.`
				);
			if (description.length > 512)
				throw new SyntaxError(
					"Module descriptions cannot be longer than 512 characters."
				);

			this.description = description;
		}

		this.from = from;
		this.to = to;
		this.method = method;
		this.label = label;
	}

	/**
	 * Get whether this module can convert files **from** a certain mimetype.
	 * @param {string} mimetype The mimetype to check.
	 * @returns {boolean} Whether or not the mimetype is supported.
	 */
	convertsFrom(mimetype) {
		if (this.from instanceof Array && this.from.includes(mimetype))
			return true;
		if (this.from === mimetype) return true;
		return false;
	}

	/**
	 * Get whether this module can convert files **to** a certain mimetype.
	 * @param {string} mimetype The mimetype to check.
	 * @returns {boolean} Whether or not the mimetype is supported.
	 */
	convertsTo(mimetype) {
		if (this.to instanceof Array && this.to.includes(mimetype)) return true;
		if (this.to === mimetype) return true;
		return false;
	}

	/**
	 * Convert an array of files using the converter's method.
	 * @param {Array<*>} files The array of files to convert.
	 * @returns {string} The path to a zip containing the converted files.
	 */
	async convert(files) {
		await Promise.all(files.map(async (file) => await this.method(file)));

		return files;
	}
}
