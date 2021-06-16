import {Connection, Repository, SelectQueryBuilder} from 'typeorm'
import {basename} from 'path'
import {NextFunction, Request, RequestHandler, Response} from 'express'
import {ModelFile, RegularFile} from '../entity/File'
import {File} from '../entity/File'
import {SearchFileResponse} from '../entity/SearchFileResponse'
import {SearchFile} from '../entity/SearchFile'
import {Upload} from '../entity/Upload'
import axios from 'axios'
import {SiteType} from '../entity/Site'
import env from './env'
import {CollectionFileResponse} from '../entity/CollectionFileResponse'

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

export const convertToReducedResponse = (parameters: (keyof SearchFileResponse)[]) =>
  (file: SearchFile) => parameters.reduce((acc, cur) => ({...acc, [cur]: convertToSearchResponse(file)[cur]}), {})

export const convertToCollectionFileResponse = (file: RegularFile | ModelFile) =>
  new CollectionFileResponse(file)

export const sortByMeasurementDateAsc = <T extends File|SearchFile>(files: T[]): T[] =>
  files.sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())

export const augmentFile = (includeS3path: boolean) =>
  (file: RegularFile|ModelFile) => ({
    ...file,
    downloadUrl: `${env.DP_BACKEND_URL}/download/${getDownloadPathForFile(file)}`,
    filename: basename(file.s3key),
    s3key: undefined,
    s3path: includeS3path ? getS3pathForFile(file) : undefined,
    model: 'model' in file ? file.model : undefined
  })

export const ssAuthString = () =>
  'Basic ' + // eslint-disable-line prefer-template
  Buffer.from(`${env.DP_SS_USER}:${env.DP_SS_PASSWORD}`).toString('base64')

export const getBucketForFile = (file: File) =>
  file.volatile ? 'cloudnet-product-volatile' : 'cloudnet-product'

export const getS3pathForUpload = (upload: Upload) =>
  `/cloudnet-upload/${upload.site.id}/${upload.uuid}/${upload.filename}`

export const getS3pathForFile = (file: File) =>
  `/${getBucketForFile(file)}/${file.s3key}`

export const getS3pathForImage = (s3key: string) =>
  `/cloudnet-img/${s3key}`

export const getDownloadPathForFile = (file: File) =>
  `product/${file.uuid}/${file.s3key}`

export async function checkFileExists(s3path: string) {
  let headers = {
    'Authorization': ssAuthString()
  }
  return axios.head(`${env.DP_SS_URL}${s3path}`, {headers})
}

// File stream handling
const fixDbDate = (date: Date) => // Add finnish timezone hours to make the date jump to next day
  new Date(date.setHours(date.getHours() + 3))

const translateKeyVal = (key: string, val: string|number|boolean|Date, acc: any) => {
  if (key.includes('Id')) return {}
  key = key.replace(/^file_/, '')
  val = (val instanceof Date && key == 'measurementDate') ? fixDbDate(val).toISOString().split('T')[0] : val
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

export const dateforsize = async (repo: Repository<any>, table: string, req: Request, res: Response, _: NextFunction) => {
  const query = req.query as any
  const startDate = new Date(query.startDate)
  const sizeBytes = parseInt(query.targetSize) * 1024 * 1024 * 1024

  const result = await repo.query(`SELECT "updatedAt" FROM (
    SELECT "updatedAt", sum(size) OVER (ORDER BY "updatedAt")
    FROM ${table} where date("updatedAt") > $1) as asd
  WHERE sum > $2 LIMIT 1`, [startDate, sizeBytes])

  if (result.length == 0) return res.sendStatus(400)
  return res.send(result[0].updatedAt)
}
