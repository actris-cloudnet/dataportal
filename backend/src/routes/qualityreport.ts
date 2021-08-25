import {Connection, Repository} from 'typeorm'
import {QualityReport} from '../entity/QualityReport'
import {Request, RequestHandler, Response} from 'express'
import {FileRoutes} from './file'


export class QualityReportRoutes {

  constructor(conn: Connection, fileRoutes: FileRoutes) {
    this.conn = conn
    this.qualityReportRepo = conn.getRepository<QualityReport>('quality_report')
    this.fileRoutes = fileRoutes
  }

  readonly conn: Connection
  readonly qualityReportRepo: Repository<QualityReport>
  readonly fileRoutes: FileRoutes


  qualityReport: RequestHandler = async (req: Request, res: Response, next) => {
    const qualityReport = await this.qualityReportRepo.findOne(req.params.uuid)
    if (qualityReport === undefined) {
      return next({ status: 404, errors: ['No files match this UUID'] })
    }
    res.send(qualityReport.report)
  }

  putQualityReport: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid = req.params.uuid
    const body = req.body as any

    try {
      const existingFile = await this.fileRoutes.findAnyFile((repo, _) => repo.findOne(uuid))
      if (existingFile === undefined)  {
        return next({status: 400, errors: ['No files match this UUID']})
      }
      existingFile.qualityScore = body.overallScore
      const updateResult = await this.fileRoutes.getRepoForFile(existingFile).update(existingFile.uuid, existingFile)
      if (!updateResult.affected) throw ('No rows updated in file table')

      const existingReport = await this.qualityReportRepo.findOne(uuid)
      if (existingReport === undefined) {
        await this.qualityReportRepo.insert({fileUuid: uuid, report: body})
        res.sendStatus(201)
      }
      await this.qualityReportRepo.update(uuid, {report: body})
      res.sendStatus(200)
    } catch (e) {
      return next({status: 500, errors: e})
    }
  }
}
