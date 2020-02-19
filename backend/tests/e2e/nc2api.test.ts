import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import { clearDir, inboxDir, publicDir, clearRepo } from '../lib'

beforeAll(async () => {
  clearDir(inboxDir)
  clearDir(publicDir)
  return clearRepo('file')
})

afterAll(async () => {
})

const expectedJson = {
  "uuid": "15506ea8-d357-4c7b-af8c-95dfcc34fc7d",
  "title": "Classification file from Bucharest",
  "measurementDate": "2019-08-23",
  "location": "Bucharest",
  "history": "2019-09-16 11:21:13 - classification file created\n2019-09-16 11:21:02 - categorize file created\n2019-09-16 11:20:30 - radar file created\nLidar backscatter derived from raw values in arbitrary units: calibrated by user Ewan O'Connor <ewan.oconnor@fmi.fi> on 25-Jul-2019.",
  "publicity": "public",
  "type": "classification",
  "cloudnetpyVersion": "1.0.4",
  "filename": "20190723_bucharest_classification.nc",
  "checksum": "b77b731aaae54f403aae6765ad1d20e1603b4454e2bc0d461aab4985a4a82ca4",
  "size": 139021,
  "format": "HDF5 (NetCDF4)"
} 

describe('after moving a valid NC file to inbox', () => {
  beforeAll(async () => {
    fs.copyFileSync('tests/data/20190723_bucharest_classification.nc', path.join(inboxDir, '20190723_bucharest_classification.nc'))
    return new Promise((resolve, _) => setTimeout(resolve, 3000))
  })

  it('should respond with a corresponding metadata JSON', async () => {
    return axios
      .get('http://localhost:3001/file/' + expectedJson.uuid)
      .then(response => expect(response.data).toMatchObject(expectedJson))
  })

  it('should serve the file', async () => {
    return axios
      .head('http://localhost:4001/' + expectedJson.filename)
      .then(response => {
        expect(response.status).toEqual(200)
        expect(parseInt(response.headers['content-length'])).toEqual(expectedJson.size)
      })
  })
})