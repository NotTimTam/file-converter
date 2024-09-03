import Module from "../util/Module.js";
import fs from "fs-extra";

const ImageToBase64 = new Module({
	label: "ImageToBase64",
	description: "Convert plaintext files to plaintext files.",
	from: ["image/jpeg", "image/png"],
	to: "text/plain",
	customReturn: true,
	method: async (file) => {
		const { path, originalname, mimetype } = file;

		const data = await fs.readFile(path);

		const base64Data = data.toString("base64");

		await fs.writeFile(path, base64Data, { encoding: "utf-8" });

		// console.log(file);

		return {
			...file,
		};
	},
});

export default ImageToBase64;
