import {Connection} from 'typeorm'
import {basename, join, resolve as pathResolve} from 'path'
import {existsSync, promises as fsp, unlinkSync} from 'fs'

export const stringify = (obj: any): string => JSON.stringify(obj, null, 2)

export const dateToUTCString = (date: string | Date) => {
  const dateDate = new Date(date)
  const minuteInMs = 60 * 1000
  return new Date(dateDate.getTime() - (dateDate.getTimezoneOffset() * minuteInMs))
    .toISOString().replace('T', ' ').replace(/\..*/, '')
}

export const fetchAll = <T>(conn: Connection, schema: Function): Promise<T[]> => {
  const repo = conn.getRepository(schema)
  return repo.find() as Promise<T[]>
}

const checkFileExists = async (path: string) => fsp.stat(path)

export function linkFile(filename: string, linkPath: string) {
  const resolvedSource = pathResolve(filename)
  const fullLink = join(linkPath, basename(filename))
  return checkFileExists(resolvedSource)
    .then(() => {
      if (existsSync(fullLink)) unlinkSync(fullLink)
      return fsp.symlink(resolvedSource, fullLink)
    })
}
