import { v4 as uuid } from "uuid";
import Module from "./Module.js";
import FileConverter from "../index.js";

/**
 * `new Job(fileConverter, files, module, options)`
 */
export default class Job {
	/**
	 * A job utilizes a `Module` to convert and store files.
	 * @param {FileConverter} fileConverter The `FileConverter` instance this job should be associated with.
	 * @param {Array<Object>} files The multer file references for the files this job will convert.
	 * @param {Module} module The module that will be used to convert this job's files.
	 * @param {Object} options The request options configuration for the module.
	 */
	constructor(fileConverter, files, module, options) {
		if (!module instanceof Module)
			throw new Error(
				`"module" value provided to Job constructor is not of type "Module".`
			);

		this.fileConverter = fileConverter;

		this.fileConverter.jobs.push(this);

		this._id = uuid();

		this.files = files;
		this.module = module;
		this.options = this.__populateOptions(options);

		this.status = {
			step: "pending",
			filesConverted: 0,
		};
	}

	/**
	 * Get an object representation of this job that can be sent to the client.
	 */
	get returnable() {
		const {
			_id,
			status,
			module: { label: module },
			files: { length: totalFiles },
			fileConverter: { clearJobOnDownload },
			options,
		} = this;
		return {
			_id,
			status: { ...status, totalFiles },
			module,
			unlimitedDownloads: !clearJobOnDownload,
			options,
		};
	}

	/**
	 * If an option value is not provided, but the `Option` has a default value configured, we populate in the default value.
	 * @param {Object} options Optional options object configuration to pass to the module conversion job.
	 * @returns {Object} The populated options.
	 */
	__populateOptions(options) {
		// Get all default values.
		const defaults = Object.fromEntries(
			this.module.options
				.filter(
					({ default: defaultValue }) =>
						defaultValue !== undefined && defaultValue !== null
				)
				.map(({ default: defaultValue, label }) => [
					label,
					defaultValue,
				])
		);

		// Filter in selected options.
		return { ...defaults, ...options };
	}

	/**
	 * Run the job.
	 * @param {function} onStep An optional asynchronous callback to run when each step of the job is complete.
	 */
	async run(onStep) {
		this.status.step = "running";

		const { files, module, fileConverter, options } = this;

		await module.convert(
			files,
			async ({ size }) => {
				fileConverter.stats.dataConverted += size / 1e6;
				fileConverter.stats.filesConverted++;
				this.status.filesConverted++;

				if (onStep && typeof onStep === "function")
					await onStep(this.status);
			},
			options
		);

		this.status.step = "done";
	}
}
