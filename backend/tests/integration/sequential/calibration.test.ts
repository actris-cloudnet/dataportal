import axios from 'axios'
import {backendPrivateUrl, genResponse} from '../../lib'
import {Connection, createConnection, Repository} from 'typeorm'
import {Calibration} from '../../../src/entity/Calibration'

let conn: Connection
let repo: Repository<Calibration>
const url = `${backendPrivateUrl}calibration/`


describe('POST /calibration', () => {

  beforeAll(async () => {
    conn = await createConnection('test')
    repo = conn.getRepository('calibration')
  })

  beforeEach(async () => {
    return repo.delete({})
  })

  afterAll(() => conn.close())

  it('on valid new calibration inserts it to the table', async () => {
    await axios.post(url, {site: 'hyytiala', instrument: 'mira', date: '2021-01-01', calibrationFactor: 0.5})
    return expect(repo.findOneOrFail()).resolves.toBeTruthy()
  })

  it('inserts two calibrations', async () => {
    await axios.post(url, {site: 'hyytiala', instrument: 'mira', date: '2021-01-01', calibrationFactor: 0.5})
    await axios.post(url, {site: 'hyytiala', instrument: 'mira', date: '2021-01-01', calibrationFactor: 0.8})
    const res = await repo.findOneOrFail()
    expect(res.calibration.length).toEqual(2)
  })
})
