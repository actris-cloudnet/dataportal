
## Data upload file types

The Cloudnet data submission API does **not** check the type or content of the uploaded files. 
If you accidentally upload some incorrect files, or files that we can't process, 
we still archive those but perhaps do nothing more. Clearly incorrect files might 
get deleted.

We recommend uploading the following files:

|ID | Instrument  | File extension / description  | Format |
|---|-------------|--------------------------|-------------|
| `mira` | METEK MIRA-35 cloud radar | `*.mmclx` files. These can be compressed, e.g., `*.mmclx.gz`.| netCDF |
| `rpg-fmcw-94` | RPG FMCW-94 cloud radar | `*.LV1` and compressed `*.LV0` files. | binary |
| `ct25k`, `cl31`, `cl51` | Vaisala ceilometers | `*.DAT` files. File extension may be different depending on collection system.  | text |
| `chm15k`, `chm15x` | Lufft ceilometers | `*.nc` files. Either non-concatenated or concatenated files but not both. | netCDF |
| `hatpro` | RPG HATPRO microwave radiometer | At least the `*.LWP` binary files, but other files are fine too (brightness temperatures, water vapour, housekeeping). | binary |
| `copernicus` | Copernicus cloud radar | `*.nc` files. | netCDF |
| `galileo` | Galileo cloud radar | `*.nc` files. | netCDF |
| `basta` | BASTA cloud radar | Daily `*.nc` files. | netCDF |
| `parsivel` | OTT Parsivel2 disdrometer | `*.log` files. | text |
| `thies-lnm` | Thies LNM disdrometer | `*.txt` files. | text |

We plan to also accept the following instrument types in the future. Note that the API will not accept these yet. 
If you have other instruments you would like to include (such as other disdrometers, lidars or ancillary instrumentation), please 
let us know and we will add them to our to-do list.

|ID | Instrument | Possible file extensions | Format |
|---|-------------|--------------------|--------------
|`pollyxt` | PollyXT Raman Lidar | `*.nc` files. Which channels? Include water vapour and depolarisation if possible? Other ACTRIS-EARLINET type lidars? | netCDF |
|`hsrl` | ARM HSRL | `*.nc` files produced by ARM / Ed Eloranta.| netCDF |
|`mpl` | ARM or MPLnet Micropulse Lidar | `*.nc` files produced by ARM or similar. | netCDF | 
|`microwave radiometer` | Radiometrics - two-channel or three-channel | `*.nc` files. | netCDF |
|`wls100s`, `wls200s`, `wls400s` |Leosphere windcube long-range scanning Doppler lidars | `*.nc` files. | netCDF |
| `halo-doppler-lidar` | Halo Photonics Doppler lidar | `*.hpl`, `Background*.txt` and `system_parameters*.txt` files. | text |
