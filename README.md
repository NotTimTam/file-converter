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

# Usage

## FileConverter

### Constructor

#### `new FileConverter(config)`

Create a new instance of the `FileConverter`.

##### Parameters

-   **config**: `Object` - An object containing configuration data.
    -   **modules**: `Array<Module>` - Additional modules to expand the converter's functionality.
    -   **fileSizeLimit**: `number` - A recommended (optional) limit for the total size of all files uploaded to the converter per request, in bytes.
    -   **temp**: `string` - An optional path to a directory for temporary file storage. Defaults to `"temp/"` in the local directory. Files are removed from this folder after they are converted.
    -   **clearJobOnDownload**: `boolean` - (default `true`) Auto-delete conversion jobs and their associated files after an api request has been made successfully to download the converted files.
    -   **DANGEROUSLYforceClearTemp**: `boolean` - (default `false`) Clear the content of the selected `temp` directory on initialization. **_This WILL delete all files in the directory indiscriminately._** When `false`, the constructor will throw an error if the directory is not empty.

### Properties

All permitted properties defined in the constructor's config parameter are passed through to the constructed object.

#### `jobs`

An array of the converter's active jobs.

#### `modules`

An array of the converter's loaded modules.

#### `stats`

An object containing stats about the instance.

-   **initialization**: `number` Milliseconds since the epoch, generated with `Date.now()`.
-   **filesConverted**: `number` The number of files converted.
-   **dataConverted**: `number` The amount of data converted. (in megabytes)

### Methods

#### `middleware(req, res, next)`

Get the file conversion express middleware function.

#### `createJob(files, module, options)`

Start a conversion job. This method is called by the express middleware to create file conversion jobs but could potentially be used in a custom environment.

-   **files**: `Array<Object>` An array of file objects to convert. Should be a [multer file object](https://github.com/expressjs/multer?tab=readme-ov-file#file-information).
-   **module**: `Module` The module to convert with.
-   **options**: `Object` Optional options object configuration to pass to the module conversion job. Keys should be the label of each option configured in the module, and the values an appropriate value to set for that option.
-   **options**: `Object` Optional options object configuration to pass to the module conversion job. Keys should be the label of each option configured in the module, and the values an appropriate value to set for that option.

##### Returns

-   `Job`: The created job.

---

## Module

```js
import { Module } from "@nottimtam/file-converter";
```

#### `new Module(config)`

Create a new file conversion module.

##### Parameters

-   **config**: `Object` - An object containing configuration data.
    -   **from**: `string | Array<string>` - The mimetype to convert from. Can be a single mimetype or an array of supported mimetypes.
    -   **to**: `string` - The mimetype to convert to.
    -   **label**: `string` - A unique label for this module.
    -   **description**: `string` (optional) - A detailed description for the module.
    -   **method**: `function` - An asynchronous callback that accepts a file object and converts that file's content, storing the converted data in the file at the provided `path` value.
    -   **options**: `Array<Module.Option>` An array of options for conversion.
    -   **customReturn**: `boolean` (optional) - By default, a `Module`'s `convert` method will change the file data to match the conversion. Setting this to `true` makes the `method` callback return the "file" data passed to it, with necessary changes (e.g., changing file extension in `originalname`). This also stops the `Module` from throwing errors if the `to`/`from` mimetype values are invalid, allowing custom file types to be used.

### Properties

All permitted properties defined in the constructor's config parameter are passed through to the constructed object.

#### `_id`

The module's UUID.

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

#### `async convert(files, callback)`

Convert an array of files using the module's conversion method.

##### Parameters

-   **files**: `Array<*>` - The array of files to convert.
-   **callback**: `function` (optional) - An asynchronous callback that is passed each file before/after it is converted. `(old, new)`

##### Returns

-   `string`: The path to a zip file containing the converted files.

---

## Module.Option

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
    -   **default**: `string|number|boolean` - (optional) The option's default value.
    -   **required**: `boolean` - (optional) Whether or not to require a value to be provided for this option. Default `false`, if `false`, the option's `validateInput` callback will not be run when no value is provided.
    -   **validateInput**: `function` - An asynchronous callback function, used to validate the value provided to this option, which is passed as the first and only parameter. Should throw an exception if the value is invalid.

### Properties

All permitted properties defined in the constructor's config parameter are passed through to the constructed object.

#### `_id`

The option's UUID.

---

## Job

Jobs are not directly exposed through an export. They are created automatically within the `new FileConverter().middleware()` method when a conversion request is made. They can also be created manually using [`new FileConverter().createJob()`](#createjobfiles-module-options).

### Properties

#### `_id`

The job's UUID.

#### `returnable`

A specialized object that returns relevant Job data, useful for sending information about a job from a server to a client.

#### `status`

An object containing data on the status of the job.

-   `**step**: `string` The current step of the job.
    -   `"pending"`: The job has not started.
    -   `"running"`: The job is in progress.
    -   `"done"`: The job has completed and the files can be downloaded.
    -   `"error"`: An uncaught error occured during the conversion process. A `error` field is added to the status object in this case.
-   **filesConverted**: `number` The number of files this job has converted.

#### `files`

An array of objects defining the files this job is responsible for.

#### `module`

The module the job will use for conversion.

#### `options`

The module options passed to the job.

### Methods

#### `async run(onStep)`

Run the job.

-   **onStep**: `function` An optional asynchronous callback to run when each step of the job is complete. `onStep` is passed one argument, the job's `status` property.

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
