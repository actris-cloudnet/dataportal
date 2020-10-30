import {Request, RequestHandler, Response} from 'express'
import {Connection, Repository} from 'typeorm'
import {dateToUTCString} from '../lib'
import {File} from '../entity/File'

export class MiscRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.fileRepo = conn.getRepository<File>('file')
  }

  readonly conn: Connection
  readonly fileRepo: Repository<File>

  status: RequestHandler = async (_req: Request, res: Response, next) =>
    this.fileRepo.createQueryBuilder('file').leftJoin('file.site', 'site')
      .select('site.id')
      .addSelect('MAX(file.releasedAt)', 'last_update')
      .addSelect('MAX(file.measurementDate)', 'last_measurement')
      .groupBy('site.id')
      .orderBy('last_update', 'DESC')
      .getRawMany()
      .then(result => {
        const pad = (str: string) => str.padEnd(21, ' ')
        let resultTable = result.map(res =>
          `${pad(res.site_id)}${pad(dateToUTCString(res.last_update))}${dateToUTCString(res.last_measurement)}`)
        resultTable.unshift(Object.keys(result[0]).map(pad).join(''))
        return res.send(`
          <html>
          <head>
          <style>body {background:#222;color:#eee}</style>
          <meta http-equiv="refresh" content="10">
          </head>
          <body>
          <pre>Status on ${dateToUTCString(new Date())}</pre>
          <pre>${resultTable.join('\n')}</pre>
          </body>
          </html>
        `)
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })
}
