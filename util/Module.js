import mime from "mime-types";

export default class Module {
	/**
	 * A file conversion module.
	 * @param {*} config The module's configuration object.
	 * @param {string} config.from The mimetype to convert from.
	 * @param {string} config.to The mimetype to convert to.
	 * @param {function} config.method An asynchronous callback, accepting.
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

		if (
			typeof from !== "string" ||
			!Object.values(mime.types).includes(from)
		)
			throw new SyntaxError(
				"Invalid 'from' value provided to Module constructor config. Expected a valid MIME type string or file extension."
			);

		if (!to)
			throw new Error(
				"No 'to' value provided to Module constructor config."
			);
		if (typeof to !== "string" || !Object.values(mime.types).includes(to))
			throw new SyntaxError(
				"Invalid 'to' value provided to Module constructor config. Expected a valid MIME type string or file extension."
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

	async convert(files) {
		return await this.method(files);
	}
}
