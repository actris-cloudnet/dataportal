export const stringify = (obj: any): string => JSON.stringify(obj, null, 2)

export const dateToUTCString = (date: string | Date) => {
  const dateDate = new Date(date)
  const hourInMs = 60 * 1000
  return new Date(dateDate.getTime() - (dateDate.getTimezoneOffset() * hourInMs))
    .toISOString().replace('T', ' ').replace(/\..*/, '')
}
