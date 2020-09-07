import {Connection} from 'typeorm'
import {basename, join, resolve as pathResolve} from 'path'
import {promises as fsp} from 'fs'

export const stringify = (obj: any): string => JSON.stringify(obj, null, 2)

export const dateToUTCString = (date: string | Date) => {
  const dateDate = new Date(date)
  const minuteInMs = 60 * 1000
  return new Date(dateDate.getTime() - (dateDate.getTimezoneOffset() * minuteInMs))
    .toISOString().replace('T', ' ').replace(/\..*/, '')
}

export const fetchAll = <T>(conn: Connection, schema: Function, options={}): Promise<T[]> => {
  const repo = conn.getRepository(schema)
  return repo.find(options) as Promise<T[]>
}

const checkFileExists = async (path: string) => fsp.stat(path)

export function linkFile(filename: string, linkPath: string) {
  const resolvedSource = pathResolve(filename)
  const fullLink = join(linkPath, basename(filename))
  return checkFileExists(resolvedSource)
    .then(async () => {
      try {
        await checkFileExists(fullLink)
        await fsp.unlink(fullLink)
      } catch { // if file does not exist do nothing
      }
      return fsp.symlink(resolvedSource, fullLink)
    })
}

export const isValidDate = (obj: any) => !isNaN(new Date(obj).getDate())

export const tomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export const toArray = (obj: string | Array<string>): Array<string> =>
  (typeof obj == 'string') ? [obj] : obj

export const rowExists = (err: any) => {
  const PG_UNIQUE_CONSTRAINT_VIOLATION = '23505'
  return typeof err == 'object' && 'code' in err && err.code == PG_UNIQUE_CONSTRAINT_VIOLATION
}
