# Calibration API reference

This is a documentation for the HTTP API for configuring the calibration factors used in cloudnet data processing.

## Routes

### POST /calibration

The route takes the following parameters in a JSON object:

- `site`: Site id
- `instrument`: Instrument id
- `date`: Date for which the calibration is valid
- `calibrationFactor`: Calibration factor as a number


### GET /calibration

This route takes the following URL parameters:


- `site`: Site id
- `instrument`: Instrument id
- `date`: Date of the calibration
- `showAll`: Boolean, show history of previous calibration factors. By default only the most recent calibration factor is returned.

NOTE: For dates that do not have a calibration factor set, the previous calibration factor is returned.
Example: given that there is a calibration factor for date 2021-01-01, querying the factor for 2021-01-02 will return the calibration factor of 2021-01-01.
