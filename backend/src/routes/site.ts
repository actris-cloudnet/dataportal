import {Request, RequestHandler, Response} from 'express'
import {Connection, Repository} from 'typeorm'
import {hideTestDataFromNormalUsers} from '../lib'
import {Site} from '../entity/Site'

export class SiteRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.siteRepo = conn.getRepository<Site>('site')
  }

  readonly conn: Connection
  readonly siteRepo: Repository<Site>

  site: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.siteRepo.createQueryBuilder('site')
      .where('site.id = :siteid', req.params)
    hideTestDataFromNormalUsers<Site>(qb, req)
      .getOne()
      .then(result => {
        if (result == undefined) return next({ status: 404, errors: ['No sites match this id'] })
        res.send(result)
      })
      .catch(err => next({ status: 500, errors: err }))
  }

  sites: RequestHandler = async (req: Request, res: Response, next) => {
    const qb = this.siteRepo.createQueryBuilder('site')
      .select()
    if (req.query.modelSites == undefined) {
      qb
        .where('array_length(site.type, 1) > 0')
      hideTestDataFromNormalUsers(qb, req)
    }
    qb
      .getMany()
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }
}
