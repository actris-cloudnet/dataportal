export interface NetCDFObject {
    title: string
    location: string
    history: string
    cloudnet_file_type: string
    cloudnetpy_version: string
    file_uuid: string
    pid: string
    Conventions: string
    year: string
    month: string
    day: string
}

// Cloudnet NC file header specification
const ncObjectSpec: Array<string> = [
  'title',
  'location',
  'history',
  'cloudnet_file_type',
  'file_uuid',
  'Conventions',
  'year',
  'month',
  'day',
]

export const getMissingFields = (obj: any) =>
  ncObjectSpec.filter(field => typeof obj[field] !== 'string')

export const isNetCDFObject = (obj: any): obj is NetCDFObject =>
  getMissingFields(obj).length == 0
