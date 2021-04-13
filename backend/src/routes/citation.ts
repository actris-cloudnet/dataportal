import {Request, RequestHandler, Response} from 'express'
import {Connection, Repository} from 'typeorm'
import {Citation} from '../entity/Citation'
import {toArray} from '../lib'

export class CitationRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.citationRepo = conn.getRepository<Citation>('citation')
  }

  readonly conn: Connection
  readonly citationRepo: Repository<Citation>


  citations: RequestHandler = async (req: Request, res: Response, next) => {
    const query: any = req.query

    if (!query.site) return next({status: 422, errors: ['At least one site id must be provided']})
    query.site = toArray(query.site)

    const citations = await this.citationRepo.createQueryBuilder('citation')
      .leftJoinAndSelect('citation.site', 'site')
      .where('site.id IN (:...site)', query)
      .getMany()

    return res.send(citations)
  }
}
