import { Connection } from 'typeorm'

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
