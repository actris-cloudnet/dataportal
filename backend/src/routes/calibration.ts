import {Connection, Repository} from 'typeorm'
import {Request, RequestHandler, Response} from 'express'
import {Calibration, CalibrationData} from '../entity/Calibration'


export class CalibrationRoutes {

  constructor(conn: Connection) {
    this.calibRepo = conn.getRepository<Calibration>('calibration')
  }

  private calibRepo: Repository<Calibration>

  calibration: RequestHandler = async (req: Request, res: Response, next) => {
    this.findCalibration(req.query)
      .then(result => {
        if (result == undefined) return next({status: 404, errors: 'Calibration data not found'})
        const calibData = result.calibration.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        if (req.query.showAll == undefined) {
          res.send([calibData[0]])
          return
        }
        res.send(calibData)
      })
      .catch(err => next({ status: 500, errors: err }))
  }

  postCalibration: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    const calibData: CalibrationData = {
      calibrationFactor: body.calibrationFactor,
      createdAt: new Date()
    }
    try {
      const existingCalib = await this.findCalibration(req.body)
      if (existingCalib) {
        existingCalib.calibration.push(calibData)
        await this.calibRepo.update(existingCalib.id, existingCalib)
        return res.sendStatus(200)
      }
      await this.calibRepo.insert({
        site: body.site,
        instrument: body.instrument,
        measurementDate: body.date,
        calibration: [calibData]
      })
      return res.sendStatus(200)
    } catch (err) {
      return next({ status: 500, errors: err })
    }
  }

  private findCalibration(query: any) {
    return this.calibRepo.createQueryBuilder('calib')
      .leftJoinAndSelect('calib.site', 'site')
      .leftJoinAndSelect('calib.instrument', 'instrument')
      .select()
      .andWhere('calib.measurementDate = :date', query)
      .andWhere('site.id = :site', query)
      .andWhere('instrument.id = :instrument', query)
      .getOne()
  }
}
