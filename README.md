# @nottimtam/file-converter

A headless, self-hostable, open-source file conversion express middleware.

## Modules

This middleware can be extended with custom file conversion `Modules` for unique use cases.

It does not ship o.o.t.b with any modules. Use [@nottimtam/file-converter-core](https://www.npmjs.com/package/@nottimtam/file-converter-core) for core conversion modules.

## GUI

While this package can be installed as a route on your express API, you can spin up a [docker container with custom GUI](https://github.com/NotTimTam/file-converter-gui) for interfacing with the utility.

## Installation and Setup

You can install this package with:

```
npm i @nottimtam/file-converter
```

You can implement this package on a route of your express API. Here is an example:

```js
import express from "express";
import FileConverter from "@nottimtam/file-converter";

const app = express(); // Create express app.

const fileConverter = new FileConverter({
	modules: [],
	fileSizeLimit: 1086666,
	temp: "./uploads/test",
});

// Middleware.
app.use(express.json());
app.use("/fcu", fileConverter.middleware()); // The route on which to access the file converter.

// Start app.
app.listen(3000, (err) => {
	if (err) {
		console.error(err);
	} else {
		console.log(`Server listening on port ${3000}.`);
	}
});
```

## FileConverter Configuration

### Constructor

#### `new FileConverter(config)`

Create a new instance of the `FileConverter`.

##### Parameters

-   **config** (optional): An object containing configuration data.
    -   **modules**: `Array<Module>` - Additional modules to expand the converter's functionality.
    -   **fileSizeLimit**: `number` - A recommended (optional) limit for the total size of all files uploaded to the converter per request, in bytes.
    -   **temp**: `string` - An optional path to a directory for temporary file storage. Defaults to `"temp/"` in the local directory. Files are removed from this folder after they are converted.
    -   **clearJobOnDownload**: `boolean` - (default `true`) Auto-delete conversion jobs and their associated files after an api request has been made successfully to download the converted files.
    -   **DANGEROUSLYforceClearTemp**: `boolean` - (default `false`) Clear the content of the selected `temp` directory on initialization. **_This WILL delete all files in the directory indiscriminately._** When `false`, the constructor will throw an error if the directory is not empty.

### Methods

#### `middleware(req, res, next)`

Get the file conversion express middleware function.

---

## Custom Conversion Modules

```js
import { Module } from "@nottimtam/file-converter";
```

#### `new Module(config)`

Create a new file conversion module.

##### Parameters

-   **config**: An object containing configuration data.
    -   **from**: `string | Array<string>` - The mimetype to convert from. Can be a single mimetype or an array of supported mimetypes.
    -   **to**: `string` - The mimetype to convert to.
    -   **label**: `string` - A unique label for this module.
    -   **description**: `string` (optional) - A detailed description for the module.
    -   **method**: `function` - An asynchronous callback that accepts a file object and converts that file's content, storing the converted data in the file at the provided `path` value.
    -   **options**: `Array<Module.Option>` An array of options for conversion.
    -   **customReturn**: `boolean` (optional) - By default, a `Module`'s `convert` method will change the file data to match the conversion. Setting this to `true` makes the `method` callback return the "file" data passed to it, with necessary changes (e.g., changing file extension in `originalname`). This also stops the `Module` from throwing errors if the `to`/`from` mimetype values are invalid, allowing custom file types to be used.

### Methods

#### `convertsFrom(mimetype)`

Check if this module can convert files from a certain mimetype.

##### Parameters

-   **mimetype**: `string` - The mimetype to check.

##### Returns

-   `boolean`: Whether the mimetype is supported.

#### `convertsTo(mimetype)`

Check if this module can convert files to a certain mimetype.

##### Parameters

-   **mimetype**: `string` - The mimetype to check.

##### Returns

-   `boolean`: Whether the mimetype is supported.

#### `convert(files, callback)`

Convert an array of files using the module's conversion method.

##### Parameters

-   **files**: `Array<*>` - The array of files to convert.
-   **callback**: `function` (optional) - An asynchronous callback that is passed each file before/after it is converted. `(old, new)`

##### Returns

-   `string`: The path to a zip file containing the converted files.

---

## Module Options

```js
import { Module } from "@nottimtam/file-converter";
```

#### `new Module.Option(config)`

Create a new module `Option`.

##### Parameters

-   **config**: An object containing configuration data.
    -   **label**: `string` - A unique label for this option.
    -   **description**: `string` (optional) - A detailed description for the option.
    -   **type**: `"string"|"number"|"boolean"` - The option's input type.
    -   **validateInput**: `function` - An asynchronous callback function, used to validate the value provided to this option, which is passed as the first and only parameter. Should throw an exception if the value is invalid.

---

## API Reference

### Routes

#### `GET /`

Get a simple API reference object.

---

#### `GET /mimetypes`

Get all valid file mimetypes.

##### Query Parameters

-   **type** (optional): Filter by mimetype type. (the first part of a mimetype string, i.e., the `"text"` in `"text/plain"`)

##### Example Response

```json
{
	"mimeTypes": [
		"image/aces",
		"image/apng",
		"image/avci",
		"image/avcs",
		"image/avif",
		"image/bmp"
		// ...
	]
}
```

---

#### `GET /mimetypes/validate`

Validate mimetype or file extension.

##### Query Parameters

-   **value** (required): The value to validate.

##### Example Response

```json
{
	"valid": true, // A boolean indicating if the mimetype is valid.
	"extension": "ez", // The file extension for this mimetype. (if valid)
	"charset": false, // The charset for this mimetype. (if valid)
	"contentType": "application/andrew-inset" // The content type of this mimetype. (if valid)
}
```

---

#### `GET /modules`

Get all file conversion modules.

##### Example Response

```json
{
	"modules": [] // An array of module information.
}
```

---

#### `POST /convert`

Convert file(s) from one filetype to another.

##### Body

-   **FormData**:
    -   **files**: The file(s) to convert.
    -   **module**: The label of the module to convert the files with.
    -   **options** A stringified JSON object containing data for the selected Module's `config.options` configuration. The keys in the object should be each `Option`'s label, and the value should be a proper format `string`, `number`, or `boolean`. (or `null` when permitted)

##### Example Response

```json
{
	"jobId": "04a0dcb0-daa2-4a2e-8195-fac138925c19" // The ID of the job in which these files are being processed.
}
```

---

#### `GET /convert/download/:jobId`

Get converted files from a job.

##### Response

-   A data stream that should be saved as a ".zip" file.

---

#### `GET /jobs`

Get all jobs that are currently running.

##### Example Response

```json
{
	"jobs": [] // An array of the current running jobs.
}
```

---

#### `DELETE /jobs`

Delete all jobs that are finished, and the temporary files associated with them.

Note: Jobs are deleted automatically after download, unless the `FileConverter` constructor's configuration `clearJobOnDownload` value is set to `false`.

---

#### `GET /jobs/:jobId`

Get a jobs that is currently running by its ID.

##### Example Response

```json
{
	"job": {} // An object of the found job.
}
```

---

#### `DELETE /jobs/:jobId`

Get a finished jobs that is by its ID and delete it and all associated files.

Note: Jobs are deleted automatically after download, unless the `FileConverter` constructor's configuration `clearJobOnDownload` value is set to `false`.

---

#### `GET /stats`

Get file conversion statistics.

##### Example Response

```json
{
	"initialization": 1725337284323, // When this file converter instance was initialized, in number of milliseconds elapsed since the epoch.
	"filesConverted": 0, // The number of files that have been converted since the converter was initialized.
	"dataConverted": 0 // The total amount of data that has been converted since the converter was initialized, in megabytes.
}
```
