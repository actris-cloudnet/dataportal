export const stringify = (obj: any): string => JSON.stringify(obj, null, 2)

export const dateToUTCString = (date: string | Date) =>
  new Date(new Date(date).getTime() - (new Date(date).getTimezoneOffset() * 60000))
    .toISOString().replace('T', ' ').replace(/\..*/, '')
