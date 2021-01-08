import {Request, RequestHandler, Response} from 'express'
import {Connection, Repository} from 'typeorm'
import {hideTestDataFromNormalUsers, toArray} from '../lib'
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
    const query: any = req.query
    const qb = this.siteRepo.createQueryBuilder('site')
      .select()

    hideTestDataFromNormalUsers(qb, req)
      .addOrderBy('site.id', 'ASC')
      .getMany()
      .then(result => {
        const typeQuery = toArray(query.type)
        if (typeQuery) result = sitesContainAtLeastOneType(result, typeQuery)
        res.send(result)
      })
      .catch(err => next({ status: 500, errors: err }))

    function sitesContainAtLeastOneType(result: Site[], typeQuery: Array<string>) {
      return result.filter(site => site.type.filter(type => typeQuery.includes(type)).length > 0)
    }

  }
}
