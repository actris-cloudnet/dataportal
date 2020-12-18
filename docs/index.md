# API reference

This is the documentation for the API v2 provided by the Cloudnet data portal.

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
- `isModelOnlySite`: `true` of this site only provides model data. `false` if the site is a regular Cloudnet site.

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

### `GET /api/models` → `Model[]`

Fetch information on the different model file types served in the data portal. Responds with an array of `Model` objects, 
each having the properties:
- `id`: Unique identifier of the model.
- `optimumOrder`: Signifies model quality. Better models have lower `optimumOrder`.

Example query:

`GET https://cloudnet.fmi.fi/api/models`

Response body:
[
  {
    "id": "ecmwf",
    "optimumOrder": 0
  },
...
]

### `GET /api/files/UUID` → `File`

Fetch metadata for a single data object using its UUID (Universal Unique IDentifier). 
All of the data objects downloaded from the data portal are associated with an UUID, 
which can be found in the data object's global attribute `file_uuid`. 
To view the global attributes of a NetCDF file, one may use `ncdump -h file.nc`.

On a successful query the route responds with a `File` object, which has the following properties:
- `uuid`: UUIDv4 identifier.
- `version`: String identifying file version.
- `pid`: Persistent identifier of the data object. Empty string for data objects that do not have a PID, such as volatile files.
- `volatile`: `true` if the file has been modified recently and may change in the future, 
`false` if the file has not been changed recently and will not change in the future.
- `measurementDate`: The date on which the data was measured, `YYYY-MM-DD`.
- `history`: A freeform history of the file set by the creator/processor of the file. This field 
is not curated in any way and may or may not contain helpful information.
- `cloudnetpyVersion`: The version of the [CloudnetPy](https://github.com/actris-cloudnet/cloudnetpy) library 
used for the generation of the file. Empty string for files which have not been processed with `CloudnetPy`
- `checksum`: The SHA-256 checksum of the file. Useful for verifying file integrity.
- `size`: Size of the file in bytes.
- `format`: The data structure of the file. Either `NetCDF3` or `HDF5 (NetCDF4)`.
- `sourceFileIds`: Comma-separated list of `uuid` strings corresponding to the source files that were used to generate the file. If the source file information is not available, this is `null`.
- `createdAt`: The datetime on which the file was created. In ISO 8601 -format.
- `updatedAt`: The datetime on which the file was last updated. In ISO 8601 -format.
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
  "measurementDate": "2020-01-05",
  "history": "2020-09-25 02:51:44 - categorize file created\n2020-09-25 02:50:07 - radar file created\n2020-09-25 02:49:27 - ceilometer file created",
  "cloudnetpyVersion": "1.3.1",
  "checksum": "51db399d73e69842988d35e7e14fff815342f6925c70c0bdc9296b2847960738",
  "size": 8836007,
  "format": "HDF5 (NetCDF4)",
  "sourceFileIds": [
    "f4cb2b92bd0c49779606b87440afa7b7",
    "6ac91e0483934db2afb3bacc97a7d8c0",
    "3171e11d022549b29e863138c406dce8"
  ],
  "createdAt": "2020-12-01T09:30:40.016Z",
  "updatedAt": "2020-12-01T09:30:40.016Z",
  "site": {
    "id": "bucharest",
    "humanReadableName": "Bucharest",
    "latitude": 44.348,
    "longitude": 26.029,
    "altitude": 93,
    "gaw": "Unknown",
    "country": "Romania",
    "isTestSite": false,
    "isModelOnlySite": false
  },
  "product": {
    "id": "categorize",
    "humanReadableName": "Categorize",
    "level": "1"
  },
  "downloadUrl": "https://cloudnet.fmi.fi/api/download/product/911bd5b1-3104-4732-9bd3-34ed8208adad/20200105_bucharest_categorize.nc",
  "filename": "20200105_bucharest_categorize.nc"
}
```

### `GET /api/files` → `File[]`

Queries the metadata of multiple files. On a successful query responds with an array of `File` objects. 
The results can be filtered with the following parameters:
- `site`: One or more `Site` ids, from which to display data files.
- `date`: Only display data from a given date. Date format is `YYYY-MM-DD` or any 
date format parseable by [JavaScript `Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) -object. 
- `dateFrom`: Limit query to files whose `measurementDate` is `dateFrom` or later. Same date format as in `date`. 
By default `measurementDate` is not limited.
- `dateTo`: Limit query to files whose `measurementDate` is `dateTo` or earlier. Same date format as in `date`.
If omitted will default to the current date.
- `product`: One or more `Product` ids, by which to filter the files.
- `model`: One or more `Model` ids, by which to filter the model files.
- `allModels`: By default the API returns only the best model available for each day. Adding this parameter will fetch all available models.
- `allVersions`: By default the API returns only the latest version of the files. Adding this parameter will fetch all existing versions.

Note: one or more of the parameters *must* be issued. A query without any valid parameters will result in a `400 Bad Request` error.

Example query for fetching metadata for all classification files from Bucharest starting at 24. April 2020 and ending at the current date:

`GET https://cloudnet.fmi.fi/api/files?site=bucharest&dateFrom=2020-04-24&product=classification`

Response body:

```json
[
  {
    "uuid": "70ca4647-eca9-437e-844c-9bf163ad73e0",
    "version": "UpJgpQ6XA-mLBSAdDuGLCFy4M0pr3Mp",
    "pid": "https://hdl.handle.net/21.12132/1.70ca4647eca9437e",
    "volatile": false,
    "measurementDate": "2020-11-25",
    "history": "2020-11-27 06:11:29 - classification file created\n2020-11-27 06:11:19 - categorize file created\n2020-11-27 06:11:05 - radar file created\n2020-11-27 06:10:23 - ceilometer file created",
    "cloudnetpyVersion": "1.3.2",
    "checksum": "6931e3ca473d8ad635aada0ff6d936227e553a78e94acae0c67a956e85ef2889",
    "size": 86966,
    "format": "HDF5 (NetCDF4)",
    "sourceFileIds": [
      "1e2e5264b6864d35829df7c14be7a243"
    ],
    "createdAt": "2020-12-01T09:39:08.399Z",
    "updatedAt": "2020-12-01T09:39:08.399Z",
    "site": {
      "id": "bucharest",
      "humanReadableName": "Bucharest",
      "latitude": 44.348,
      "longitude": 26.029,
      "altitude": 93,
      "gaw": "Unknown",
      "country": "Romania",
      "isTestSite": false,
      "isModelOnlySite": false
    },
    "product": {
      "id": "classification",
      "humanReadableName": "Classification",
      "level": "2"
    },
    "downloadUrl": "https://cloudnet.fmi.fi/api/download/product/70ca4647-eca9-437e-844c-9bf163ad73e0/20201125_bucharest_classification.nc",
    "filename": "20201125_bucharest_classification.nc"
  },
...
]
```

## Examples

The following examples use the `curl` and `jq` applications. They can be installed from the package
repositories of most UNIX-based systems.

### Multiple sites and products as parameters

Fetch all model and classification products from Norunda and Granada:

```shell
curl "https://cloudnet.fmi.fi/api/files?site=norunda&site=granada&product=model&product=classification"
```

### Fetching all versions

Fetch all versions of a classification product from Granada on 2020-05-20:

```shell
curl "https://cloudnet.fmi.fi/api/files?site=granada&product=classification&dateFrom=2020-05-20&dateTo=2020-05-20&allVersions"
```

### Using the API to download all data objects matching a criteria

Download all data since 1. October 2020, saving them to the current working directory:

```shell
curl "https://cloudnet.fmi.fi/api/files?dateFrom=2020-10-01" | jq '.[]["downloadUrl"]' | xargs -n1 curl -O
```

That is, get the filtered list of file metadata, pick the `downloadUrl` properties from each of the `File` objects
and pass them on to `curl` again to download.

### Python example

Download one day of classification data from all sites using the `requests` package:

```python
import requests

url = 'https://cloudnet.fmi.fi/api/files'
payload = {
    'dateFrom': '2020-10-01',
    'dateTo': '2020-10-01',
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
