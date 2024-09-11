import { v4 as uuid } from "uuid";
import Module from "./Module.js";

export default class Job {
	constructor(fileConverter, files, module, options) {
		this.fileConverter = fileConverter;

		this.fileConverter.jobs.push(this);

		this._id = uuid();

		this.files = files;
		this.module = module;
		this.options = options;

		if (!module instanceof Module)
			throw new Error(
				`"module" value provided to Job constructor is not of type "Module".`
			);

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
		return Object.fromEntries(
			Object.entries(options).map(([name, value]) => {
				// Find default value.
				const option =
					this.module &&
					this.module.options.find(({ label }) => label === name);
				const defaultValue = option && option.default;

				// Populate default value when no value is provided.
				if (
					(value === undefined || value === null) &&
					defaultValue !== undefined &&
					defaultValue !== null
				)
					return [name, defaultValue];

				// Return unpopulated value otherwise.
				return [name, value];
			})
		);
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
