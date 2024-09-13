import express from "express";
import fs from "fs-extra";

import helpRoutes from "./routes/helpRoutes.js";
import modulesRoutes from "./routes/modulesRoutes.js";
import mimeTypesRoutes from "./routes/mimeTypesRoutes.js";
import jobsRoutes from "./routes/jobsRoutes.js";
import convertRoutes from "./routes/convertRoutes.js";

import Module from "./util/Module.js";
import Job from "./util/Job.js";

export { default as Module } from "./util/Module.js";

/**
 * `new FileConverter(<config>)`
 */
export default class FileConverter {
	/**
	 * A FileConverter instance.
	 *
	 * @param {Object} config Constructor configuration data.
	 * @param {Array<Module>} config.modules Additional modules to expand the converter's functionality.
	 * @param {number} config.fileSizeLimit A recommended (optional) limit for the total size of all files uploaded to the converter per request, in bytes.
	 * @param {string} config.temp An optional path to a directory for temporary file storage. Defaults to `"temp/"` in the local directory. Files are removed from this folder after they are converted.
	 * @param {boolean} config.clearJobOnDownload (default `true`) Auto-delete conversion jobs and their associated files after an api request has been made successfully to download the converted files.
	 * @param {boolean} config.DANGEROUSLYforceClearTemp (default `false`) Clear the content of the selected `temp` directory on initialization. ***This WILL delete all files in the directory indiscriminately.*** When `false`, the constructor will throw an error if the directory is not empty.
	 */
	constructor(config = {}) {
		try {
			this.jobs = [];
			this.modules = [];
			this.stats = {
				initialization: Date.now(),
				filesConverted: 0,
				dataConverted: 0,
			};

			if (config.modules) {
				if (!(config.modules instanceof Array))
					throw new SyntaxError(
						`Invalid "modules" value provided in FileConverter config. Expected an array.`
					);

				for (const module of config.modules)
					if (!(module instanceof Module))
						throw new SyntaxError(
							`All objects passed in config.modules array must be an instance of "Module".`
						);

				this.modules = config.modules;
			}

			if (config.fileSizeLimit) {
				if (
					typeof config.fileSizeLimit !== "number" ||
					config.fileSizeLimit < 0
				)
					throw new SyntaxError(
						`Invalid 'fileSizeLimit' value provided to FileConverter constructor config.`
					);

				this.fileSizeLimit = config.fileSizeLimit;
			}

			if (config.temp) {
				if (typeof config.temp !== "string")
					throw new Error(
						`Invalid 'temp' value provided to FileConverter constructor config. Expected a string of a directory path.`
					);

				if (fs.existsSync(config.temp)) {
					const stats = fs.lstatSync(config.temp);

					if (!stats.isDirectory())
						throw new Error(
							`The path "${config.temp}" is not a directory.`
						);

					const { length: contents } = fs.readdirSync(config.temp);

					if (contents > 0 && !config.DANGEROUSLYforceClearTemp)
						throw new Error(
							`The directory at "${config.temp}" is not empty! The file conversion temp directory must be empty upon initialization.`
						);
				}

				this.temp = config.temp;
			} else {
				this.temp = "temp/";
			}

			this.clearJobOnDownload = Boolean(config.clearJobOnDownload);

			if (this.modules && this.modules.length > 0) {
				let overlap = [];

				for (const module of this.modules) {
					if (overlap.includes(module.label))
						throw new Error(
							`Failed to load module as a module has already been loaded with the label "${module.label}".`
						);

					overlap.push(module.label);
				}
			}

			this.__clearCache();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	__clearCache() {
		fs.removeSync(this.temp);
	}

	/**
	 * Get a job by its ID.
	 * @param {string} jobId The ID of the job to get.
	 * @returns {Job} The requested job.
	 */
	__getJob(jobId) {
		return this.jobs.find(({ _id }) => _id === jobId);
	}

	/**
	 * Start a conversion job.
	 * @param {Array<*>} files An array of file objects to convert.
	 * @param {Module} module The module to convert with.
	 * @param {Object} options Optional options object configuration to pass to the module conversion job.
	 * @returns {Job} The created job.
	 */
	createJob(files, module, options) {
		return new Job(this, files, module, options);
	}

	/**
	 * Get an express middleware function.
	 *
	 * Implement with:
	 * ```js
	 * import express from "express";
	 * import FileConverter from "file-converter";
	 *
	 * const app = express():
	 *
	 * app.use("/<route-for-conversion>", new FileConverter().middleware())
	 * ```
	 *
	 * @returns {express.core.Router} An express `Router` object.
	 */
	middleware(req, res, next) {
		const router = express.Router();

		router.use((req, res, next) => {
			req.fileConverter = this;
			next();
		});

		router.use("/modules", modulesRoutes);
		router.use("/mimetypes", mimeTypesRoutes);
		router.use("/jobs", jobsRoutes);
		router.use("/convert", convertRoutes);
		router.get("/stats", (req, res) => res.status(200).json(this.stats));
		router.use("/", helpRoutes);

		return router;
	}

	/**
	 * Replace a file's extension with a new one. (`myfile.txt` -> `myfile.json`)
	 * This method only modifies and returns a string, it does not convert the file.
	 * @param {string} filename The file name, including its extension.
	 * @param {string} extension The new file extension to set.
	 * @returns {string} The modified filename.
	 */
	static replaceFileExtension(filename, extension) {
		filename = filename.split(".");
		filename.pop();
		filename.push(extension);
		filename = filename.join(".");

		return filename;
	}

	/**
	 * Does necessary transformations to bridge the gap between multer and mime-types.
	 * @param {Array<Object>} files The multer file references for the files this job will convert.
	 * @returns {Array<Object>} The transformed files.
	 */
	__transformFiles = (files) =>
		files.map((file) => {
			if (file.mimetype === "video/avi")
				file.mimetype = "video/x-msvideo";

			return file;
		});
}
