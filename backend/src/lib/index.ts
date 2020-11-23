import {Connection, SelectQueryBuilder} from 'typeorm'
import {basename, join, resolve as pathResolve} from 'path'
import {promises as fsp} from 'fs'
import {Request} from 'express'
import {File} from '../entity/File'
import {SearchFileResponse} from '../entity/SearchFileResponse'
import config from '../config'
import {SearchFile} from '../entity/SearchFile'

export const S3_BAD_HASH_ERROR_CODE = 'BadDigest'

export const stringify = (obj: any): string => JSON.stringify(obj, null, 2)

export const dateToUTCString = (date: string | Date) => {
  const dateDate = new Date(date)
  const minuteInMs = 60 * 1000
  return new Date(dateDate.getTime() - (dateDate.getTimezoneOffset() * minuteInMs))
    .toISOString().replace('T', ' ').replace(/\..*/, '')
}

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

const checkFileExists = async (path: string) => fsp.stat(path)

export async function linkFile(filename: string, linkPath: string) {
  const resolvedSource = pathResolve(filename)
  const fullLink = join(linkPath, basename(filename))
  await checkFileExists(resolvedSource)
  try {
    await checkFileExists(fullLink)
    await fsp.unlink(fullLink)
  } catch { // if file does not exist do nothing
  }
  return fsp.symlink(resolvedSource, fullLink)
}

export const isValidDate = (obj: any) => !isNaN(new Date(obj).getDate())

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

export const toArray = (obj: string | Array<string>): Array<string> =>
  (typeof obj == 'string') ? [obj] : obj

export const rowExists = (err: any) => {
  const PG_UNIQUE_CONSTRAINT_VIOLATION = '23505'
  return typeof err == 'object' && 'code' in err && err.code == PG_UNIQUE_CONSTRAINT_VIOLATION
}

export const hideTestDataFromNormalUsers = <T>(dbQuery: SelectQueryBuilder<T>, req: Request): SelectQueryBuilder<T> =>
  req.query.developer !== undefined ? dbQuery : dbQuery.andWhere('not site.isTestSite')

export const convertToSearchResponse = (files: SearchFile[]) =>
  files.map(file => new SearchFileResponse(file))

export const sortByMeasurementDateAsc = (files: File[]) =>
  files.sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())

export const augmentFiles = (files: any[]) =>
  files.map(entry => ({ ...entry, url: `${config.fileServerUrl}${entry.filename}` }))

export const ssAuthString = () =>
  'Basic ' + // eslint-disable-line prefer-template
  Buffer.from(`${config.storageService.user}:${config.storageService.password}`).toString('base64')