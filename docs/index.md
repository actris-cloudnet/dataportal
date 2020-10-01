# API reference

This is the documentation for the API v1 provided by the Cloudnet data portal.

## General

We provide an HTTP REST API for programmatical access to the metadata at the Cloudnet data portal. 
The API responds with JSON and can be accessed via the base URL `https://cloudnet.fmi.fi/api/`. 
Metadata can be queried via the following routes.

## Routes

### `GET /api/sites` → `Site[]`

Fetch information on all of the measuring stations in the system. Responds with an array of `Site` objects, 
each having the properties:
- `id`: Unique site identifier.
- `humanReadableName`: Name of the site in a human readable format.
- `latitude`: Latitude of the site given with the precision of three decimals.
- `longitude`: Longitude of the site given with the precision of three decimals.
- `altitude`: Elevation of the site from sea level in meters.
- `gaw`: Global Atmosphere Watch identifier. If the site does not have one, `Unknown`.
- `country`: The country in which the site resides. Human readable.
- `isTestSite`: Used internally. Always `false`.

Example query:

`GET https://cloudnet.fmi.fi/api/sites`

Response body:

```json
[
  {
    "id": "bucharest",
    "humanReadableName": "Bucharest",
    "latitude": 44.348,
    "longitude": 26.029,
    "altitude": 93,
    "gaw": "Unknown",
    "country": "Romania",
    "isTestSite": false
  },
...
]
```

### `GET /api/products` → `Product[]`

Fetch information on the products served in the data portal. Responds with an array of `Product` objects, 
each having the properties:
- `id`: Unique identifier of the product.
- `humanReadableName`: Name of the product in a human readable format.
- `level`: Product level. May be either `1` or `2`.

Example query:

`GET https://cloudnet.fmi.fi/api/products`

Response body:
```json
[
  {
    "id": "categorize",
    "humanReadableName": "Categorize",
    "level": "1"
  },
...
]
```

### `GET /api/instruments` → `Instrument[]`

Fetch information on the instruments supported by the data portal. Responds with an array of `Instrument` objects, 
each having the properties:
- `id`: Unique identifier of the instrument.
- `humanReadableName`: Name of the instrument in a human readable format.
- `type`: Instrument type. May be, for example, `radar`, `lidar` or `mwr`.

Example query:

`GET https://cloudnet.fmi.fi/api/instruments`

Response body:
```json
[
  {
    "id": "mira",
    "humanReadableName": "METEK MIRA-35 cloud radar",
    "type": "radar"
  },
...
]
```

### `GET /api/files/UUID` → `File`

Fetch metadata for a single data object using its UUID (Universal Unique IDentifier). 
All of the data objects downloaded from the data portal are associated with an UUID, 
which can be found in the data object's global attribute `file_uuid`. 
To view the global attributes of a NetCDF file, one may use `ncdump -h file.nc`.

On a successful query the route responds with a `File` object, which has the following properties:
- `uuid`: UUIDv3 identifier.
- `pid`: Persistent identifier of the data object. Empty string for data objects that do not have a PID, such as volatile files.
- `volatile`: `true` if the file has been modified recently and may change in the future, 
`false` if the file has not been changed recently and will not change in the future.
- `title`: A human readable title of the data object 
- `measurementDate`: The date on which the data was measured, `YYYY-MM-DD`.
- `history`: A freeform history of the file set by the creator/processor of the file. This field 
is not curated in any way and may or may not contain helpful information.
- `publicity`: Used internally. Always `public`.
- `cloudnetpyVersion`: The version of the [CloudnetPy](https://github.com/actris-cloudnet/cloudnetpy) library 
used for the generation of the file. Empty string for files which have not been processed with `CloudnetPy`
- `releasedAt`: The datetime on which the file was made public on the data portal. In ISO 8601 -format.
- `filename`: The name of the file.
- `checksum`: The SHA-256 checksum of the file. Useful for verifying file integrity.
- `size`: Size of the file in bytes.
- `format`: The data structure of the file. Either `NetCDF3` or `HDF5 (NetCDF4)`.
- `sourceFileIds`: Comma-separated list of `uuid` strings corresponding to the source files that were used to generate the file. If the source file information is not available, this is `null`.
- `url`: The full URL to the data object. Useful for downloading the file.
- `site`: `Site` object containing information of the site on which the measurement was made.
- `product`: `Product` object containing information of the data product.


Example query:

`GET https://cloudnet.fmi.fi/api/files/8e1c61fe-e6c1-472a-bd47-8c69ea3789b8`

Response body:
```json
{
  "uuid": "8e1c61fe-e6c1-472a-bd47-8c69ea3789b8",
  "pid": "https://hdl.handle.net/21.12132/1.8e1c61fee6c1472a",
  "volatile": false,
  "title": "Model file from Bucharest",
  "measurementDate": "2020-04-26",
  "history": "2020-04-27 04:00:18 - global attributes fixed using attribute_modifier 0.0.1\nSun Apr 26 21:32:53 EEST 2020 - NetCDF generated from original data by Ewan O'Connor <ewan.oconnor@fmi.fi> using cnmodel2nc on cloudnet.fmi.fi",
  "publicity": "public",
  "cloudnetpyVersion": "",
  "releasedAt": "2020-04-27T04:00:19.766Z",
  "filename": "20200426_bucharest_ecmwf.nc",
  "checksum": "1e64830a85088db2b476ba2c85064c9f2ea17bdd8e28bc0efdc9e9cab57321f5",
  "size": 501484,
  "format": "NetCDF3",
  "sourceFileIds": null,
  "site": {
    "id": "bucharest",
    "humanReadableName": "Bucharest",
    "latitude": 44.348,
    "longitude": 26.029,
    "altitude": 93,
    "gaw": "Unknown",
    "country": "Romania",
    "isTestSite": false
  },
  "product": {
    "id": "model",
    "humanReadableName": "Model",
    "level": "1"
  },
  "url": "https://cloudnet.fmi.fi/download/20200426_bucharest_ecmwf.nc"
}
```

### `GET /api/files` → `File[]`

Queries the metadata of multiple files. On a successful query responds with an array of `File` objects. 
The results can be filtered with the following parameters:
- `location`: One or more `Site` ids, from which to display data files.
- `dateFrom`: Limit query to files whose `measurementDate` is `dateFrom` or later. `YYYY-MM-DD` or any 
date format parseable by [JavaScript `Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) -object. 
By default `measurementDate` is not limited.
- `dateTo`: Limit query to files whose `measurementDate` is `dateTo` or earlier. `YYYY-MM-DD` or any 
date format parseable by [JavaScript `Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) -object. 
If omitted will default to the current date.
- `product`: One or more `Product` ids, by which to filter the files.
- `allVersions`: By default the API returns only the latest version of the files. Adding this parameter will fetch all existing versions.

Note: one or more of the parameters *must* be issued. A query without any valid parameters will result in a `400 Bad Request` error.

Example query for fetching metadata for all model files from Bucharest starting at 24. April 2020 and ending at the current date:

`GET https://cloudnet.fmi.fi/api/files?location=bucharest&dateFrom=2020-04-24&product=classification`

Response body:

```json
[
  {
    "uuid": "03701a1a-a461-4aa7-80f4-f69b8ac170b9",
    "pid": "https://hdl.handle.net/21.12132/1.5a52e97bbcaf4f9f",
    "volatile": false,
    "title": "Classification file from Bucharest",
    "measurementDate": "2020-04-25",
    "history": "2020-04-27 05:00:45 - classification file created\n2020-04-27 05:00:45 - categorize file created\n2020-04-27 05:00:28 - radar file created\n2020-04-27 05:00:30 - ceilometer file created",
    "publicity": "public",
    "cloudnetpyVersion": "1.2.1",
    "releasedAt": "2020-04-27T05:00:46.329Z",
    "filename": "20200425_bucharest_classification.nc",
    "checksum": "3a5c3c335702251370b1c5df055faad4b53ba66780217a313aac00d983e688e6",
    "size": 111023,
    "format": "HDF5 (NetCDF4)",
    "sourceFileIds": null,
    "site": {
      "id": "bucharest",
      "humanReadableName": "Bucharest",
      "latitude": 44.348,
      "longitude": 26.029,
      "altitude": 93,
      "gaw": "Unknown",
      "country": "Romania",
      "isTestSite": false
    },
    "product": {
      "id": "classification",
      "humanReadableName": "Classification",
      "level": "2"
    },
    "url": "https://cloudnet.fmi.fi/download/20200425_bucharest_classification.nc"
  },
...
]
```

More examples can be found near the end of this document.

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

## Examples

The following examples use the `curl` and `jq` applications. They can be installed from the package 
repositories of most UNIX-based systems.

### Multiple sites and products as parameters

Fetch all model and classification products from Mace Head and Granada:

`curl "https://cloudnet.fmi.fi/api/files?location=macehead&location=granada&product=model&product=classification"`


### Fetching all versions

Fetch all versions of a classification product from Granada on 2020-05-20:

`curl "https://cloudnet.fmi.fi/api/files?location=granada&product=classification&dateFrom=2020-05-20&dateTo=2020-05-20&allVersions"`


### Using the API to download all data objects matching a criteria

Download all data since 24. April 2020, saving them to the current working directory:

`curl "https://cloudnet.fmi.fi/api/files?dateFrom=2020-04-24" | jq '.[]["url"]' | xargs -n1 curl -O`

That is, get the filtered list of file metadata, pick the `url` properties from each of the `File` objects 
and pass them on to `curl` again to download.

## Notes

The API provides `gzip` compression of responses where applicable. 
We recommend using the compression for large queries to reduce transmitted response size. 
The compression can be enabled effortlessly in `curl` with the `--compressed` switch.
