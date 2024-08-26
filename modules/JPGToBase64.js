import Module from "../util/Module.js";
import fs from "fs-extra";

const JPGToBase64 = new Module({
	label: "JPGToBase64",
	description: "Convert plaintext files to plaintext files.",
	from: "image/jpeg",
	to: "text/plain",
	// customReturn: true,
	method: async (file) => {
		const { path, originalname, mimetype } = file;

		const data = await fs.readFile(path);

		const base64Data = data.toString("base64");

		await fs.writeFile(path, base64Data, { encoding: "utf-8" });

		// console.log(file);

		// return {
		// 	...file,
		// };
	},
});

export default JPGToBase64;
