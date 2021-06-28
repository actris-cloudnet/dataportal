# API reference

This is the documentation for the API v2 provided by the Cloudnet data portal.

## General

We provide an HTTP REST API for programmatic access to the metadata at the Cloudnet data portal. 
The API responds with JSON and can be accessed via the base URL `https://cloudnet.fmi.fi/api/`. 
Metadata can be queried via the following routes. For examples on how to use the API programmatically, see [Examples](#examples).


## Index

1. [Routes](#routes)
   1. [Sites](#get-apisites--site)
   1. [Products](#get-apiproducts--product)
   1. [Instruments](#get-apiinstruments--instrument)
   1. [Models](#get-apimodels--model)
   1. [File by uuid](#get-apifilesuuid--file)
   1. [Product files](#get-apifiles--file)
   1. [Model files](#get-apimodel-files--modelfile)
1. [Examples](#examples)
1. [Notes](#notes)
1. [Errors](#errors)


## Routes

### `GET /api/sites` → `Site[]`

Fetch information on all the measuring stations in the system. Responds with an array of `Site` objects, 
each having the properties:
- `id`: Unique site identifier.
- `humanReadableName`: Name of the site in a human-readable format.
- `type`: An array of site type identifiers. Types are as follows:
  - `arm`: Atmospheric Radiation Measurement (ARM) site.
  - `campaign`: Temporary measurement sites.
  - `cloudnet`: Official Cloudnet sites.
  - `hidden`: Sites that are not visible in the search GUI.
- `latitude`: Latitude of the site given with the precision of three decimals.
- `longitude`: Longitude of the site given with the precision of three decimals.
- `altitude`: Elevation of the site from sea level in meters.
- `gaw`: Global Atmosphere Watch identifier. If the site does not have one, `Unknown`.
- `country`: The country in which the site resides. Human-readable.

Example query:

`GET https://cloudnet.fmi.fi/api/sites`

Response body:

```json
[
    {
    "id": "alomar",
    "humanReadableName": "Alomar",
    "type": [
      "hidden"
    ],
    "latitude": 62.278,
    "longitude": 16.008,
    "altitude": 380,
    "gaw": "Unknown",
    "country": "Norway"
  },
...
]
```

### `GET /api/products` → `Product[]`

Fetch information on the products served in the data portal. Responds with an array of `Product` objects, 
each having the properties:
- `id`: Unique identifier of the product.
- `humanReadableName`: Name of the product in a human-readable format.
- `level`: Product level. Is either `1b`, `1c`, or `2`.

Example query:

`GET https://cloudnet.fmi.fi/api/products`

Response body:
```json
[
  {
    "id": "categorize",
    "humanReadableName": "Categorize",
    "level": "1c"
  },
...
]
```

### `GET /api/instruments` → `Instrument[]`

Fetch information on the instruments supported by the data portal. Responds with an array of `Instrument` objects, 
each having the properties:
- `id`: Unique identifier of the instrument.
- `humanReadableName`: Name of the instrument in a human readable format.
- `type`: Instrument type. May be, for example, `radar`, `lidar`, or `mwr`.
- `auxiliary`: Boolean. `true` if the instrument data is only stored and not used in operational processing. Otherwise `false`.

Example query:

`GET https://cloudnet.fmi.fi/api/instruments`

Response body:
```json
[
  {
    "id": "mira",
    "humanReadableName": "METEK MIRA-35 cloud radar",
    "type": "radar",
    "auxiliary": false
  },
...
]
```

### `GET /api/models` → `Model[]`

Fetch information on the different model file types served in the data portal. Responds with an array of `Model` objects, 
each having the properties:
- `id`: The unique identifier of the model.
- `optimumOrder`: Integer that signifies model quality. Better models have lower `optimumOrder`.

Example query:

`GET https://cloudnet.fmi.fi/api/models`

Response body:
```json
[
  {
    "id": "ecmwf",
    "optimumOrder": 0
  },
...
]
```

### `GET /api/files/UUID` → `File`

Fetch metadata for a single data object using its UUID (Universal Unique IDentifier). 
All the data objects downloaded from the data portal are associated with a UUID, 
which can be found in the data object's global attribute `file_uuid`. 
To view the global attributes of a NetCDF file, one may use `ncdump -h file.nc`.

On a successful query the route responds with a `File` object, which has the following properties:
- `uuid`: UUIDv4 identifier.
- `version`: String identifying file version. Empty string on volatile files.
- `pid`: The persistent identifier of the data object. Empty string for data objects that do not have a PID, such as volatile files.
- `volatile`: `true` if the file has been modified recently and may change in the future, 
- `legacy`: `true` if the file is legacy data, `false` if it has been processed with CloudnetPy.
`false` if the file has not been changed recently and will not change in the future.
- `measurementDate`: The date on which the data was measured, `YYYY-MM-DD`.
- `history`: A freeform history of the file set by the creator/processor of the file. This field 
is not curated in any way and may or may not contain helpful information.
- `checksum`: The SHA-256 checksum of the file. Useful for verifying file integrity.
- `size`: Size of the file in bytes.
- `format`: The data structure of the file. Either `NetCDF3` or `HDF5 (NetCDF4)`.
- `createdAt`: The datetime on which the file was created. In ISO 8601 -format.
- `updatedAt`: The datetime on which the file was last updated. In ISO 8601 -format.
- `sourceFileIds`: Comma-separated list of `uuid` strings corresponding to the source files that were used to generate the file. If the source file information is not available, this is `null`.
- `cloudnetpyVersion`: The version of the [CloudnetPy](https://github.com/actris-cloudnet/cloudnetpy) library. 
- `site`: `Site` object containing information of the site on which the measurement was made.
- `product`: `Product` object containing information of the data product.
- `downloadUrl`: The full URL to the data object. Useful for downloading the file.
- `filename`: The name of the file.


Example query:

`GET https://cloudnet.fmi.fi/api/files/911bd5b1-3104-4732-9bd3-34ed8208adad`

Response body:
```json
{
  "uuid": "911bd5b1-3104-4732-9bd3-34ed8208adad",
  "version": "icRZfkXzTHB2-uuRTDaSV-eQu6N5wNm",
  "pid": "https://hdl.handle.net/21.12132/1.911bd5b131044732",
  "volatile": false,
  "legacy": false,
  "measurementDate": "2020-01-05",
  "history": "2020-09-25 02:51:44 - categorize file created\n2020-09-25 02:50:07 - radar file created\n2020-09-25 02:49:27 - ceilometer file created",
  "checksum": "51db399d73e69842988d35e7e14fff815342f6925c70c0bdc9296b2847960738",
  "size": "8836007",
  "format": "HDF5 (NetCDF4)",
  "createdAt": "2020-12-01T09:30:40.016Z",
  "updatedAt": "2020-12-01T09:30:40.016Z",
  "sourceFileIds": [
    "f4cb2b92bd0c49779606b87440afa7b7",
    "6ac91e0483934db2afb3bacc97a7d8c0",
    "3171e11d022549b29e863138c406dce8"
  ],
  "cloudnetpyVersion": "1.3.1",
  "site": {
    "id": "bucharest",
    "humanReadableName": "Bucharest",
    "type": [
      "cloudnet"
    ],
    "latitude": 44.348,
    "longitude": 26.029,
    "altitude": 93,
    "gaw": "Unknown",
    "country": "Romania"
  },
  "product": {
    "id": "categorize",
    "humanReadableName": "Categorize",
    "level": "1c"
  },
  "downloadUrl": "https://cloudnet.fmi.fi/api/download/product/911bd5b1-3104-4732-9bd3-34ed8208adad/20200105_bucharest_categorize.nc",
  "filename": "20200105_bucharest_categorize.nc"
}
```

### `GET /api/files` → `File[]`

Queries the metadata of multiple product files. On a successful query responds with an array of `File` objects. 
The results can be filtered with the following parameters:
- `site`: One or more `Site` ids, from which to fetch file metadata.
- `date`: Only fetch data from a given date. Date format is `YYYY-MM-DD` or any 
date format parseable by [JavaScript `Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) -object. 
- `dateFrom`: Limit query to files whose `measurementDate` is `dateFrom` or later. Same date format as in `date`. 
By default `measurementDate` is not limited.
- `dateTo`: Limit query to files whose `measurementDate` is `dateTo` or earlier. Same date format as in `date`.
If omitted will default to the current date.
- `product`: One or more `Product` ids, by which to filter the files. May NOT be `model`; for model files, see route `/api/model-files`.
- `filename`: One or more filenames by which to filter the files.
- `allVersions`: By default the API returns only the latest version of the files. Adding this parameter will fetch all existing versions.
- `showLegacy`: By default the API does not return legacy data. Adding this parameter will fetch also legacy data.

Note: one or more of the parameters *must* be issued. A query without any valid parameters will result in a `400 Bad Request` error.

Example query for fetching metadata for all classification files from Bucharest starting at 24. April 2020 and ending at the current date:

`GET https://cloudnet.fmi.fi/api/files?site=bucharest&dateFrom=2020-04-24&product=classification`

Response body:

```json
[
  {
    "uuid": "f63628b4-7e68-4c98-87ea-86a247f7fcfd",
    "version": "",
    "pid": "",
    "volatile": true,
    "legacy": false,
    "measurementDate": "2021-02-21",
    "history": "2021-02-23 08:04:18 - classification file created\n2021-02-23 08:04:01 - categorize file created\n2021-02-23 02:04:13 - radar file created\n2021-02-23 02:04:24 - ceilometer file created",
    "checksum": "9ccd36e4c6ee94c5179e34e08ff7898bf31979277badeb5806b688a30e23feda",
    "size": "82547",
    "format": "HDF5 (NetCDF4)",
    "createdAt": "2021-02-23T02:05:03.970Z",
    "updatedAt": "2021-02-23T08:04:20.186Z",
    "cloudnetpyVersion": "1.9.2",
    "site": {
      "id": "bucharest",
      "humanReadableName": "Bucharest",
      "type": [
        "cloudnet"
      ],
      "latitude": 44.348,
      "longitude": 26.029,
      "altitude": 93,
      "gaw": "Unknown",
      "country": "Romania"
    },
    "product": {
      "id": "classification",
      "humanReadableName": "Classification",
      "level": "2"
    },
    "downloadUrl": "https://cloudnet.fmi.fi/api/download/product/f63628b4-7e68-4c98-87ea-86a247f7fcfd/20210221_bucharest_classification.nc",
    "filename": "20210221_bucharest_classification.nc"
  },
...
]
```

### `GET /api/model-files` → `ModelFile[]`

Queries the metadata of model files. It offers the following parameters for filtering the results:

- `site`: One or more `Site` ids, from which to fetch file metadata.
- `date`: Only fetch data from a given date. Date format is `YYYY-MM-DD` or any
  date format parseable by [JavaScript `Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) -object.
- `dateFrom`: Limit query to files whose `measurementDate` is `dateFrom` or later. Same date format as in `date`.
  By default `measurementDate` is not limited.
- `dateTo`: Limit query to files whose `measurementDate` is `dateTo` or earlier. Same date format as in `date`.
  If omitted will default to the current date.
- `filename`: One or more filenames by which to filter the files.
- `model`: One or more `Model` ids, by which to filter the files.
- `allModels`: By default the API returns only the best model available matching the given search parameters. Adding this parameter will fetch all model files matching the search paramterers.

The `ModelFile` response similar to the `File` response, with an additional `model` property. The `model` property containing a `Model` object (see example response).
Furthermore, the `ModelFile` response omits the fields `cloudnetPyVersion` and `sourceFileIds`, as this information is not available for model files.

Example query for fetching metadata for `gdas1` model from Lindenberg on 2. March 2021:

`GET https://cloudnet.fmi.fi/api/model-files?site=lindenberg&date=2021-02-03&model=gdas1`

Response body:

```json
[
  {
    "uuid": "90f95f81-4f45-4efb-a25d-80066652aece",
    "version": "",
    "pid": "",
    "volatile": true,
    "legacy": false,
    "measurementDate": "2021-02-03",
    "history": "2021-02-04 08:10:26 - File content harmonized by the CLU unit.\n03-Feb-2021 18:59:45: Created from GDAS1 profiles produced with the profile binary in the HYSPLIT offline package using convert_gdas12pro.sh.",
    "checksum": "0b8b621ad2d76ca629451f56c94b79b432caba9c2839b3fcc535910544b3b854",
    "size": "194983",
    "format": "HDF5 (NetCDF4)",
    "createdAt": "2021-02-04T08:10:28.001Z",
    "updatedAt": "2021-02-04T08:10:28.001Z",
    "site": {
      "id": "lindenberg",
      "humanReadableName": "Lindenberg",
      "type": [
        "cloudnet"
      ],
      "latitude": 52.208,
      "longitude": 14.118,
      "altitude": 104,
      "gaw": "LIN",
      "country": "Germany"
    },
    "product": {
      "id": "model",
      "humanReadableName": "Model",
      "level": "1b"
    },
    "model": {
      "id": "gdas1",
      "optimumOrder": 3
    },
    "downloadUrl": "https://cloudnet.fmi.fi/api/download/product/90f95f81-4f45-4efb-a25d-80066652aece/20210203_lindenberg_gdas1.nc",
    "filename": "20210203_lindenberg_gdas1.nc"
  }
]
```

## Examples

The following examples use the `curl` and `jq` applications. They can be installed from the package
repositories of most UNIX-based systems.

### Multiple sites and products as parameters

Fetch all categorize and classification products from Norunda and Granada:

```shell
curl "https://cloudnet.fmi.fi/api/files?site=norunda&site=granada&product=categorize&product=classification"
```

### Fetching all versions

Fetch all versions of the classification product from Granada on 2020-05-20:

```shell
curl "https://cloudnet.fmi.fi/api/files?site=granada&product=classification&date=2020-05-20&allVersions"
```

### Model data

Fetch the optimum model file from Bucharest on 2020-12-10:

```shell
curl "https://cloudnet.fmi.fi/api/model-files?site=bucharest&date=2020-12-10"
```

Fetch all available models:

```shell
curl "https://cloudnet.fmi.fi/api/model-files?site=bucharest&date=2020-12-10&allModels"
```

Fetch only the `gdas1` model:

```shell
curl "https://cloudnet.fmi.fi/api/model-files?site=bucharest&date=2020-12-10&model=gdas1"
```

### Using the API to download all data objects matching a criteria

Download all data measured on 1. October 2020, saving them to the current working directory:

```shell
curl "https://cloudnet.fmi.fi/api/files?date=2020-10-01" | jq '.[]["downloadUrl"]' | xargs -n1 curl -O
```

That is, get the filtered list of file metadata, pick the `downloadUrl` properties from each of the `File` objects
and pass them on to `curl` again to download.

### Python example

Download one day of classification data from all sites using the `requests` package:

```python
import requests

url = 'https://cloudnet.fmi.fi/api/files'
payload = {
    'date': '2020-10-01',
    'product': 'classification'
}
metadata = requests.get(url, payload).json()
for row in metadata:
    res = requests.get(row['downloadUrl'])
    with open(row['filename'], 'wb') as f:
        f.write(res.content)
```

## Notes

The API provides `gzip` compression of responses where applicable.
We recommend using the compression for large queries to reduce transmitted response size.
The compression can be enabled effortlessly in `curl` with the `--compressed` switch.

## Errors

The API responds to errors with the appropriate HTTP status code and an `Error` object, which has the properties:
- `status`: HTTP error code.
- `message`: Human readable error message as a string or an array of strings.

Example query:

`GET https://cloudnet.fmi.fi/api/files?product=sausage`

Response body:

```json
{
  "status": 404,
  "errors": [
    "One or more of the specified products were not found"
  ]
}
```
