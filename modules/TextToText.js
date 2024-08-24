import Module from "../util/Module.js";

const TextToText = new Module({
	label: "TextToText",
	description: "Convert plaintext files to plaintext files.",
	from: "text/plain",
	to: "text/plain",
	method: (files) => {
		console.log(files);

		return files;
	},
});

export default TextToText;
