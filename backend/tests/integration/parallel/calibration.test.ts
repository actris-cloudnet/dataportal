import {backendPublicUrl} from '../../lib'
import axios from 'axios'

const url = `${backendPublicUrl}calibration/`

describe('GET /api/calibration', () => {

  it('responds with the correct calibration for correct date', async () => {
    const res = await axios.get(url, { params: {site: 'hyytiala', instrument: 'mira', date: '2021-01-01' }})
    expect(res.data).toHaveLength(1)
    return expect(res.data[0].calibrationFactor).toEqual(0.5)
  })

  it('responds with the latest calibration', async () => {
    const res = await axios.get(url, { params: {site: 'hyytiala', instrument: 'mira', date: '2021-01-05' }})
    expect(res.data).toHaveLength(1)
    return expect(res.data[0].calibrationFactor).toEqual(0.9)
  })

  it('responds with 404 if instrument has no calibration set', async () => {
    const params = {site: 'hyytiala', instrument: 'chm15k', date: '2021-01-01' }
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 404 }})
  })

  it('responds with 404 if calibration is set only for a later date', async () => {
    const params = {site: 'hyytiala', instrument: 'hyytiala', date: '2020-12-31' }
    return expect(axios.get(url, { params })).rejects.toMatchObject({ response: { status: 404 }})
  })


  it('responds with a list of all calibrations', async () => {
    const res = await axios.get(url, { params: {site: 'hyytiala', instrument: 'mira', date: '2021-01-01', showAll: true }})
    expect(res.data).toHaveLength(2)
    expect(res.data[0].calibrationFactor).toEqual(0.5)
    return expect(res.data[1].calibrationFactor).toEqual(0.2)
  })

})
