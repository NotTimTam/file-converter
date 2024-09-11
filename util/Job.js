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
