import express from "express";
import helpRoutes from "./routes/helpRoutes.js";
import modulesRoutes from "./routes/modulesRoutes.js";
import mimeTypesRoutes from "./routes/mimeTypesRoutes.js";
import convertRoutes from "./routes/convertRoutes.js";
import Module from "./util/Module.js";
import Modules from "./modules/index.js";
import fs from "fs";
import path from "path";

export { default as Module } from "./util/Module.js";

export default class FileConverter {
	/**
	 * A FileConverter instance.
	 *
	 * @param {*} config Constructor configuration data.
	 * @param {Array<Module>} config.modules Additional modules to expand the converter's functionality.
	 * @param {number} config.fileSizeLimit A recommended (optional) limit for the total size of all files uploaded to the converter per request, in bytes.
	 * @param {string} config.temp An optional path to a directory for temporary file storage. Defaults to `"temp/"` in the local directory. Files are removed from this folder after they are converted.
	 */
	constructor(config = { modules: [] }) {
		try {
			this.modules = Modules;

			if (config) {
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

					this.modules = [...this.modules, ...config.modules];
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
								`The path ${config.temp} is not a directory.`
							);
					}

					this.temp = config.temp;
				} else {
					this.temp = "temp/";
				}
			}

			let overlap = [];

			for (const module of this.modules) {
				if (overlap.includes(module.label))
					throw new Error(
						`Failed to load module as a module has already been loaded with the label "${module.label}".`
					);

				overlap.push(module.label);
			}
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
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
		router.use("/convert", convertRoutes);
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
}
