import {backendPrivateUrl, backendPublicUrl} from '../../lib'
import axios from 'axios'

const url = `${backendPublicUrl}calibration/`

describe('GET /api/calibration', () => {

  it('responds with the correct calibration', async () => {
    const res = await axios.get(url, { params: {site: 'hyytiala', instrument: 'mira', date: '2021-01-01' }})
    expect(res.data).toHaveLength(1)
    expect(res.data[0].calibrationFactor).toEqual(0.5)
  })

  it('responds with a list of all calibrations', async () => {
    const res = await axios.get(url, { params: {site: 'hyytiala', instrument: 'mira', date: '2021-01-01', showAll: true }})
    expect(res.data).toHaveLength(2)
    expect(res.data[0].calibrationFactor).toEqual(0.5)
    expect(res.data[1].calibrationFactor).toEqual(0.2)
  })

})
