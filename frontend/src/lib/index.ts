import {Visualization} from '../../../backend/src/entity/Visualization'
import {SearchFileResponse} from '../../../backend/src/entity/SearchFileResponse'
import {Product} from '../../../backend/src/entity/Product'

export const getProductIcon = (product: Product | string) => {
  try {
    return require(`../assets/icons/${typeof product == 'string' ? product : product.id}.png`)
  } catch (e) {
    return require('../assets/icons/unknown.png')
  }

}

export const humanReadableSize = (size: number) => {
  if (size == 0) return '0 B'
  const i = Math.floor( Math.log(size) / Math.log(1024) )
  return `${( size / Math.pow(1024, i) ).toFixed(1)  } ${  ['B', 'kB', 'MB', 'GB', 'TB'][i]}`
}

export const humanReadableDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })

export const humanReadableTimestamp = (date: string) => {
  const [timestamp, suffix] = date.replace('T', ' ').split('.')
  return suffix.includes('Z') ? `${timestamp} UTC` : timestamp
}

export const combinedFileSize = (files: SearchFileResponse[]) =>
  files.map(file => file.size).reduce((prev, cur) => cur + prev, 0)

export const dateToUTC = (date: Date) =>
  new Date(date.getTime() - (date.getTimezoneOffset() * 60000))

export const dateToString = (date: Date) => {
  const utcTime = dateToUTC(date)
  return utcTime.toISOString().substring(0,10)
}

export const sortVisualizations = (visualizations: Visualization[]) => {
  return visualizations.concat().sort((a: Visualization, b: Visualization) => {
    if (a.productVariable.order == b.productVariable.order) return 0
    if (a.productVariable.order < b.productVariable.order) return -1
    return 1
  })
}

export const fixedRanges = Object.freeze({'week':6, 'month':29})

export function getDateFromBeginningOfYear(): Date {
  const currentYear = new Date().getFullYear().toString()
  return new Date(`${currentYear}-01-01`)
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate()=== b.getDate()
}

export function constructTitle(files: SearchFileResponse[]) {
  return files.map(file => ({...file, title: `${file.product} file from ${file.site}`}))
}

