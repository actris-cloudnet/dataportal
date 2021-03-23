# Data submission API v2 reference

This is the documentation for the HTTP API allowing sites to submit data files for archiving, 
processing and publication in the Cloudnet data portal. This documentation is for API v2.

## Submitting files

File submission has two stages: metadata and data upload. Metadata of the file must be uploaded 
before uploading the file itself. You can find sample scripts in [examples](#examples).

### Metadata upload

Metadata is uploaded by sending a `POST` request to `https://cloudnet.fmi.fi/upload/metadata/`.
The route accepts `application/json` type data, and requires HTTP Basic authentication.
The JSON request should have the following fields:

- `measurementDate`: UTC date in `YYYY-MM-DD` format of the first data point in the file.
- `instrument`: Instrument name. Must be one of the ids listed in [https://cloudnet.fmi.fi/api/instruments/](https://cloudnet.fmi.fi/api/instruments/). 
  See also [expected file types](upload-file-types.md).
- `filename`: Name of the file.
- `checksum`: An MD5 sum of the file being sent. Used for identifying the file and verifying its integrity. 
  Can be computed by using for instance the `md5sum` UNIX program.

Example JSON for uploading a file named `201030_020000_P06_ZEN.LV1`:

```json
{
  "measurementDate": "2020-10-30",
  "instrument": "rpg-fmcw-94",
  "filename": "201030_020000_P06_ZEN.LV1",
  "checksum": "e07910a06a086c83ba41827aa00b26ed"
}
```

Example of metadata upload with the `curl` command:

```bash
curl -u USERNAME:PASSWORD \
  -H "Content-Type: application/json" \
  -d '{"measurementDate":"2020-10-30","instrument":"rpg-fmcw-94","filename":"201030_020000_P06_ZEN.LV1","checksum":"e07910a06a086c83ba41827aa00b26ed"}' \
  https://cloudnet.fmi.fi/upload/metadata/
```
Replace `USERNAME` and `PASSWORD` with your station's credentials. You can acquire the credentials 
by contacting the CLU team at actris-cloudnet-feedback@fmi.fi.
  
### Data upload

After uploading the metadata, the file itself is uploaded by sending a `PUT` request to `https://cloudnet.fmi.fi/upload/data/<md5>`, 
where `<md5>` is replaced by the file's MD5 checksum. The body of the request should be the file contents. 
Use the `Transfer-Encoding: chunked` HTTP header when uploading files.

Example using `curl`:

```bash
curl -u USERNAME:PASSWORD \
  -H "Transfer-Encoding: chunked" \
  --upload-file 201030_020000_P06_ZEN.LV1 \
  https://cloudnet.fmi.fi/upload/data/e07910a06a086c83ba41827aa00b26ed
```

## Examples

Here are some examples for submitting a `chmk15k` file named `file1.nc` from the current working directory.

### Bash

```bash
FILENAME="file1.nc"
USERNAME="example"
PASSWORD="letmein"
HASH=$(md5sum $FILENAME | cut -f 1 -d " ")
JSON=$(cat << EOF
{
 "measurementDate": "2020-10-30",
 "instrument": "chm15k",
 "filename": "$FILENAME",
 "checksum": "$HASH"
}
EOF
)

# Upload metadata
printf "Uploading $FILENAME\t"
MD_RESPONSE=$(curl -s -i -u $USERNAME:$PASSWORD \
   -H "Content-Type: application/json" \
   -d "$JSON" \
   https://cloudnet.fmi.fi/upload/metadata/)

STATUS_CODE=$(echo "$MD_RESPONSE" | head -1 | cut -d' ' -f2)
if test $STATUS_CODE -ne 200 ; then # Handle errors
   RESPONSE_BODY=$(echo "$MD_RESPONSE" | tail -1)
   echo "$RESPONSE_BODY"
else # Upload data
DATA_RESPONSE=$(curl -s -u $USERNAME:$PASSWORD \
   -H "Transfer-Encoding: chunked" \
   --upload-file "$FILENAME" \
   https://cloudnet.fmi.fi/upload/data/$HASH)
echo "$DATA_RESPONSE"
fi
```

### Python

This example uses the python library `requests` for submitting requests.

```python
import hashlib
import requests

filename = 'file1.nc'
username = 'granada'
password = 'letmein'

# Compute hash
md5_hash = hashlib.md5()
with open(filename, 'rb') as f:
   for byte_block in iter(lambda: f.read(4096), b""):
       md5_hash.update(byte_block)

checksum = md5_hash.hexdigest()

metadata = {
   'filename': filename,
   'checksum': checksum,
   'measurementDate': '2020-10-30',
   'instrument': 'chm15k',
}

# Upload metadata
print(f'Uploading {filename}', end='\t')
res = requests.post('https://cloudnet.fmi.fi/upload/metadata/',
   json=metadata,
   auth=(username, password))

if res.status_code != 200: # Handle errors
   print(res.text)
else: # Upload data
   res = requests.put(f'https://cloudnet.fmi.fi/upload/data/{checksum}',
       data=open(filename, 'rb'),
       auth=(username, password))
   print(res.text)

```

## Responses

The following status codes are used by the server to signal the success/failure of the (meta)data upload.
Each response is accompanied by a message elaborating the cause of the status code.

### Metadata
- `200 OK`: Metadata creation was successful.
- `400 Bad Request`: There was a problem in handling the request. Check request headers and content type.
- `401 Unauthorized`: Problem in authentication. Check credentials.
- `409 Conflict`: Metadata for this file already exists, and the file has been received. Do not attempt file submission.
- `422 Unprocessable Entity`: Problem in handling metadata body. Check that the metadata JSON is correct.

### Data

- `201 Created`: File was received successfully.
- `200 OK`: File already exists, doing nothing.
- `400 Bad Request`: There was a problem in handling the request. Check that the MD5 checksum is valid and corresponds to the file.
- `401 Unauthorized`: Problem in authentication. Check credentials.

