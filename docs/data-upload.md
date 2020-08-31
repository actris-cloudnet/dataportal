# Data upload API reference

This is the documentation for the API allowing sites to upload data files for processing and
publication in the Cloudnet data portal. This documentation is for API v1.

## Uploading files

Files can be uploaded by sending a `POST` request to `https://cloudnet.fmi.fi/data-upload/`.
The route accepts `multipart/form-data` type data, and requires HTTP Basic authentication.
The request should have the following fields:

- `hashSum`: An sha256-sum of the file being sent. Used for identifying the file and verifying its integrity.
- `measurementDate`: UTC date in `YYYY-MM-DD` format of the first data point in the file.
- `instrument`: Instrument name. Must be one of the ids listed in `https://cloudnet.fmi.fmi/instruments/`.
- `file`: The file contents in binary.

Following is a simple bash script for uploading a file named `file1.LV1`.
The script uses `sha256sum` to compute the hash sum and `curl` to make the HTTP request:

```shell script
FILENAME="file1.nc"
USERNAME="example"
PASSWORD="letmein"
HASH=$(sha256sum $FILENAME | cut -f 1 -d " ")

curl -v -X POST -u $USERNAME:$PASSWORD -H "Transfer-Encoding: chunked" \
    -F hashSum=$HASH \
    -F measurementDate=2020-09-01 \
    -F instrument=chm15k \
    -F file=@$FILENAME \
    https://cloudnet.fmi.fi/data-upload/
```

Both `sha256sum` and `curl` are available on most UNIX-based systems.
Note that `USERNAME` and `PASSWORD` need to be changed to match the credentials provided to you by the
Cloudnet team.

Here is an another example for uploading the file using the Python library `requests`:

```python
import hashlib
import requests

filename = 'file1.nc'
username = 'example'
password = 'letmein'

# Compute hash
sha256_hash = hashlib.sha256()
with open(filename, 'rb') as f:
    for byte_block in iter(lambda: f.read(4096), b""):
        sha256_hash.update(byte_block)

hash_str = sha256_hash.hexdigest()


# Send request
metadata = {
    'hashSum': hash_str,
    'measurementDate': '2020-09-01',
    'instrument': 'chm15k',
}

file = {'file': open(filename, 'rb')}

res = requests.post('https://cloudnet.fmi.fi/data-upload/',
    data=metadata,
    files=file,
    auth=(username, password))
```

## Responses

The server responds to requests with the following HTTP status codes:

- `200 OK`: File was received successfully or a file with the same hash already exists.
- `400 Bad Request`: There was a problem in handling the request. Check request headers and content type.
- `401 Unauhtorized`: Problem in authentication. Check credentials.
- `422 Unprocessable Entity`: Problem in handling metadata. Check that the metadata fields are valid.

Each response is accompanied by a message elaborating the cause of the status code.