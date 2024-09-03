import mime from "mime-types";
import FileConverter from "../index.js";

export default class Module {
	/**
	 * A file conversion module.
	 * @param {*} config The module's configuration object.
	 * @param {string|Array<string>} config.from The mimetype to convert from. Can be an array of supported mimetypes.
	 * @param {string} config.to The mimetype to convert to.
	 * @param {string} config.label A unique label for this module.
	 * @param {string} config.description Optional detailed description for module.
	 * @param {function} config.method An asynchronous callback, that accepts a file object, and converts that file's content, storing the converted data in the file at the provided `path` value.
	 * @param {boolean} config.customReturn By default, a `Module`'s `convert` method will change the file data to match the conversion that takes place.
	 * Setting this value to `true` will make it so that the `method` callback must return the "file" data passed to it,
	 * with any necessary changes made, such as changing the file extension in the `originalname` parameter,
	 * or changing the encoding/mimetype. This value also stops the `Module` from throwing an error if the provided `to`/`from` mimetype values are "invalid".
	 */
	constructor(
		config = {
			method: async (_) => _,
			customReturn: false,
		}
	) {
		if (!config)
			throw new Error("No config provided to Module constructor.");

		const { from, to, method, label, description, customReturn } = config;

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
					`(${label}) Expected a string value for Module constructor config.description.`
				);
			if (description.length > 512)
				throw new SyntaxError(
					`(${label}) Module descriptions cannot be longer than 512 characters.`
				);

			this.description = description;
		}

		if (!from)
			throw new Error(
				`(${label}) No 'from' value provided to Module constructor config.`
			);

		if (from instanceof Array)
			for (const mimetype of from) {
				if (
					typeof mimetype !== "string" ||
					(!Object.values(mime.types).includes(mimetype) &&
						!customReturn)
				)
					throw new SyntaxError(
						`(${label}) Invalid 'from' value provided to Module constructor config. Expected a valid MIME type, file extension, or array of those values.`
					);
			}
		else if (
			typeof from !== "string" ||
			(typeof from === "string" &&
				!Object.values(mime.types).includes(from) &&
				!customReturn)
		)
			throw new SyntaxError(
				`(${label}) Invalid 'from' value provided to Module constructor config. Expected a valid MIME type, or array of MIME types.`
			);

		if (!to)
			throw new Error(
				`(${label}) No 'to' value provided to Module constructor config.`
			);

		if (
			typeof to !== "string" ||
			(typeof to === "string" &&
				!Object.values(mime.types).includes(to) &&
				!customReturn)
		)
			throw new SyntaxError(
				`(${label}) Invalid 'to' value provided to Module constructor config. Expected a valid MIME type.`
			);

		if (!method || typeof method !== "function")
			throw new SyntaxError(
				`(${label}) Expected an asynchronous callback function for Module constructor config.method value.`
			);

		this.from = from;
		this.to = to;
		this.method = method;
		this.label = label;
		this.customReturn = customReturn;
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
	 * Validate a converted file object.
	 * @param {*} file The file object to validate.
	 * @returns {string|boolean} `true` if the file object is valid, or a string that explains the reason why it isn't.
	 */
	validateConvertedFileObject = (file) => {
		const fieldValidators = {
			fieldname: (value) =>
				value === "files"
					? true
					: `File object field "fieldname" should equal "files"`,
			originalname: (value) => {
				if (!value || typeof value !== "string")
					return `Expected string value for file field "originalname"`;

				value = value.split(".");

				if (
					!this.customReturn &&
					(!value[value.length - 1] ||
						mime.lookup(value[value.length - 1]) !== this.to)
				)
					return `Unexpected file extension "${
						value[value.length - 1]
					}" provided.`;

				return true;
			},
			encoding: (value) =>
				value && typeof value === "string"
					? true
					: `Expected a valid mime content type or "7bit" for file field "originalname".`,
			mimetype: (value) => {
				if (
					!value ||
					typeof value !== "string" ||
					!Object.values(mime.types).includes(value)
				)
					return `Expected a valid mimetype for file field "mimetype".`;

				if (!this.convertsTo(value))
					return `Mimetype provided to file object is not the mimetype this Module converts to. Expected "${this.to}".`;

				return true;
			},
			destination: (value) =>
				value && typeof value === "string"
					? true
					: `Expected multer-generated path string for file field "destination".`,
			filename: (value) =>
				value && typeof value === "string"
					? true
					: `Expected a multer-generated for file field "filename".`,
			path: (value) =>
				value && typeof value === "string"
					? true
					: `Expected a multer-generated string for file field "path".`,
			size: (value) =>
				value && typeof value === "number"
					? true
					: `Expected a number for file field "size".`,
		};

		for (const [key, value] of Object.entries(file)) {
			if (!fieldValidators.hasOwnProperty(key))
				return `Invalid field "${key}" in file object.`;

			const valid = fieldValidators[key](value);

			if (valid !== true) return valid;
		}

		return true;
	};

	/**
	 * Convert an array of files using the converter's method.
	 * @param {Array<*>} files The array of files to convert.
	 * @param {function} callback An optional asynchronous callback that is passed each file before/after it is converted. `(old, new)`
	 * @returns {string} The path to a zip containing the converted files.
	 */
	async convert(files, callback) {
		const { label, customReturn } = this;

		files = await Promise.all(
			files.map(async (file) => {
				const old = JSON.stringify(file);
				const newFile = await this.method(file);

				// If the method callback does return file data.
				if (newFile) {
					if (customReturn) {
						const valid = this.validateConvertedFileObject(newFile);
						if (valid !== true) throw new Error(valid);
					} else
						throw new Error(
							`(${label}) This module's 'customReturn' parameter is 'false'/'undefined', but the module's method callback returns a file data object, even though it shouldn't.`
						);
				} else {
					// If the method callback does NOT return file data.
					if (customReturn)
						throw new Error(
							`(${label}) This module's 'customReturn' parameter is 'true', but the module's method callback does not return a file data object.`
						);
					else {
						file.mimetype = this.to;
						file.encoding = mime.charset(file.mimetype);

						// Replace the filename.
						file.originalname = FileConverter.replaceFileExtension(
							file.originalname,
							mime.extension(file.mimetype)
						);
					}
				}

				if (callback)
					await callback(
						JSON.parse(old),
						customReturn ? newFile : file
					);
			})
		);

		return files;
	}
}
