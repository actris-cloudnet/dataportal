import {Connection, SelectQueryBuilder} from 'typeorm'
import {basename} from 'path'
import {Request} from 'express'
import {ModelFile, RegularFile} from '../entity/File'
import {File} from '../entity/File'
import {SearchFileResponse} from '../entity/SearchFileResponse'
import config from '../config'
import {SearchFile} from '../entity/SearchFile'
import {Upload} from '../entity/Upload'
import axios from 'axios'
import {SiteType} from '../entity/Site'

export const stringify = (obj: any): string => JSON.stringify(obj, null, 2)

export const dateToJSDate = (year: string, month: string, day: string): Date => {
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  )
}

export const fetchAll = <T>(conn: Connection, schema: Function, options={}): Promise<T[]> => {
  const repo = conn.getRepository(schema)
  return repo.find(options) as Promise<T[]>
}

export const isValidDate = (obj: any) => {
  const date = new Date(obj)
  const now = new Date()
  now.setHours(now.getHours() + 3)
  return !isNaN(date.getDate())
    && date.getTime() <= now.getTime()
    && date.getTime() > new Date('1970-01-01').getTime()
}

export const tomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export const dateNDaysAgo = (n: number) => {
  const dateInPast = new Date()
  dateInPast.setDate(dateInPast.getDate() - n)
  return dateInPast
}

export const toArray = (obj: string | Array<string> | undefined): Array<string> | null => {
  if (!obj) return null
  else if (typeof obj == 'string') return [obj]
  return obj

}

export const rowExists = (err: any) => {
  const PG_UNIQUE_CONSTRAINT_VIOLATION = '23505'
  return typeof err == 'object' && 'code' in err && err.code == PG_UNIQUE_CONSTRAINT_VIOLATION
}

export const hideTestDataFromNormalUsers = <T>(dbQuery: SelectQueryBuilder<T>, req: Request): SelectQueryBuilder<T> =>
  req.query.developer !== undefined ? dbQuery : dbQuery.andWhere('not :type = ANY(site.type)', {type: SiteType.TEST})

export const convertToSearchResponse = (file: SearchFile) =>
  new SearchFileResponse(file)

export const sortByMeasurementDateAsc = <T extends File|SearchFile>(files: T[]): T[] =>
  files.sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())

export const augmentFile = (file: File|RegularFile|ModelFile) => ({
  ...file,
  downloadUrl: `${config.downloadBaseUrl}${getDownloadPathForFile(file)}`,
  filename: basename(file.s3key),
  s3key: undefined,
  model: 'model' in file ? file.model : undefined
})

export const ssAuthString = () =>
  'Basic ' + // eslint-disable-line prefer-template
  Buffer.from(`${config.storageService.user}:${config.storageService.password}`).toString('base64')

export const getBucketForFile = (file: File) =>
  file.volatile ? 'cloudnet-product-volatile' : 'cloudnet-product'

export const getS3keyForUpload = (upload: Upload) =>
  `${upload.site.id}/${upload.uuid}/${upload.filename}`

export const getDownloadPathForFile = (file: File) =>
  `product/${file.uuid}/${file.s3key}`

export async function checkFileExists(bucket: string, s3key: string) {
  let headers = {
    'Authorization': ssAuthString()
  }
  return axios.head(`http://${config.storageService.host}:${config.storageService.port}/${bucket}/${s3key}`, {headers})
}

// File stream handling
const translateKeyVal = (key: string, val: string|number|boolean|Date, acc: any) => {
  if (key.includes('Id')) return {}
  key = key.replace(/^file_/, '')
  val = (val instanceof Date && key == 'measurementDate') ? val.toJSON().split('T')[0] : val
  let subKey
  [key, subKey] = key.split('_')
  if (!subKey) return { [key]: val }
  else return { [key]: {
    ...acc[key],
    ...{ [subKey]: val }
  }
  }
}

export const transformRawFile = (obj: any): RegularFile|ModelFile|SearchFile => {
  return Object.keys(obj).reduce((acc: {[key: string]: any}, key) => ({
    ...acc,
    ...translateKeyVal(key, obj[key], acc)
  }), {}) as RegularFile|ModelFile|SearchFile
}
