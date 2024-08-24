import express from "express";
import helpRoutes from "./routes/helpRoutes.js";
import modulesRoutes from "./routes/modulesRoutes.js";
import mimeTypesRoutes from "./routes/mimeTypesRoutes.js";
import convertRoutes from "./routes/convertRoutes.js";
import Module from "./util/Module.js";
import Modules from "./modules/index.js";

export { default as Module } from "./util/Module.js";

export default class FileConverter {
	/**
	 * A FileConverter instance.
	 *
	 * @param {*} config Constructor configuration data.
	 * @param {Array<Module>} config.modules Additional modules to expand the converter's functionality.
	 * @param {number} config.fileSizeLimit A recommended (optional) limit for the total size of all files uploaded to the converter per request, in bytes.
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
}
