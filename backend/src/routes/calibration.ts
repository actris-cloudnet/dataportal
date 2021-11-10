import {Connection, Repository} from 'typeorm'
import {Request, RequestHandler, Response} from 'express'
import {Calibration, CalibrationData} from '../entity/Calibration'

type NewCalibration = Omit<Calibration, 'id'>


export class CalibrationRoutes {

  constructor(conn: Connection) {
    this.calibRepo = conn.getRepository<Calibration>('calibration')
  }

  private calibRepo: Repository<Calibration>

  calibration: RequestHandler = async (req: Request, res: Response, next) => {
    const query = req.query
    if (!(query['date'] && query['instrument'] && query['site']))
      return next({status: 400, errors: 'Following parameters must all be specified: date, instrument, site'})
    try {
      let result = await this.findCalibration(req.query)
      if (result == undefined) {
        result = await this.findLatestCalibration(req.query)
        if (result == undefined) return next({status: 404, errors: 'Calibration data not found'})
      }
      const calibData = result.calibration.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (req.query.showAll == undefined) {
        res.send([calibData[0]])
        return
      }
      res.send(calibData)
    } catch (e) {
      next({ status: 500, errors: e })
    }
  }

  postCalibration: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    const calibData: CalibrationData = {
      calibrationFactor: body.calibrationFactor,
      createdAt: new Date()
    }
    const newCalib: NewCalibration = {
      site: body.site,
      instrument: body.instrument,
      measurementDate: body.date,
      calibration: [calibData]
    }
    try {
      const existingCalib = await this.findCalibration(req.body)
      if (existingCalib) {
        existingCalib.calibration.push(calibData)
        await this.calibRepo.update(existingCalib.id, existingCalib)
        return res.sendStatus(200)
      }
      const lastCalib = await this.findLatestCalibration(req.body)
      const calibrations = this.createCalibrationsForInterval(lastCalib, newCalib)
      await this.calibRepo.insert(calibrations)
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

  private findLatestCalibration(query: any) {
    return this.calibRepo.createQueryBuilder('calib')
      .leftJoinAndSelect('calib.site', 'site')
      .leftJoinAndSelect('calib.instrument', 'instrument')
      .select()
      .andWhere('calib.measurementDate < :date', query)
      .andWhere('site.id = :site', query)
      .andWhere('instrument.id = :instrument', query)
      .orderBy('calib.measurementDate', 'DESC')
      .limit(1)
      .getOne()
  }

  private createCalibrationsForInterval(lastCalib: Calibration | undefined, newCalib: NewCalibration) {
    let result = []
    if (lastCalib) {
      for (let date = new Date(lastCalib.measurementDate);
        date < new Date(newCalib.measurementDate);
        date.setDate(date.getDate() + 1)) {
        result.push({...lastCalib, id: undefined, measurementDate: new Date(date)})
      }
      result.splice(0, 1)
    }
    result.push(newCalib)
    return result
  }
}
