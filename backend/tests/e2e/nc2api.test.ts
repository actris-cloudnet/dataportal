import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import { clearDir, inboxDir, inboxSubDir, publicDir, clearRepo, backendUrl, fileServerUrl, wait } from '../lib'

beforeAll(async () => {
  clearDir(inboxDir)
  clearDir(inboxSubDir)
  clearDir(publicDir)
  return clearRepo('file')
})

afterAll(async () => {
})

const expectedJson = {
  'uuid': '15506ea8-d357-4c7b-af8c-95dfcc34fc7d',
  'title': 'Classification file from Bucharest',
  'measurementDate': '2019-07-23',
  'history': '2019-09-16 11:21:13 - classification file created\n2019-09-16 11:21:02 - categorize file created\n2019-09-16 11:20:30 - radar file created\nLidar backscatter derived from raw values in arbitrary units: calibrated by user Ewan O\'Connor <ewan.oconnor@fmi.fi> on 25-Jul-2019.',
  'publicity': 'public',
  'cloudnetpyVersion': '1.0.4',
  'filename': '20190723_bucharest_classification.nc',
  'checksum': 'b77b731aaae54f403aae6765ad1d20e1603b4454e2bc0d461aab4985a4a82ca4',
  'size': 139021,
  'format': 'HDF5 (NetCDF4)',
  'product': {
    'humanReadableName': 'Classification',
    'id': 'classification',
    'level': '2',
  },
  'site': {
    'id': 'bucharest',
    'humanReadableName': 'Bucharest',
    'latitude': 44.348,
    'longitude': 26.029,
    'altitude': 93,
    'gaw': 'Unknown',
    'country': 'Romania'
  }
}


const expectedUuidFromSubFolder = '926ba5cb-19e2-4153-8d87-9d97596f5574'

describe('after moving a valid NC file to inbox', () => {
  beforeAll(async () => {
    fs.copyFileSync('tests/data/20190723_bucharest_classification.nc', path.join(inboxDir, '20190723_bucharest_classification.nc'))
    return wait(4000)
  })

  it('should respond with a corresponding metadata JSON', async () => {
    return axios
      .get(`${backendUrl}file/${expectedJson.uuid}`)
      .then(response => expect(response.data).toMatchObject(expectedJson))
  })

  it('should serve the file', async () => {
    return axios
      .head(`${fileServerUrl}${expectedJson.filename}`)
      .then(response => {
        expect(response.status).toEqual(200)
        expect(parseInt(response.headers['content-length'])).toEqual(expectedJson.size)
      })
  })

})


describe('after moving a valid NC file to inbox subfolder', () => {
  beforeAll(async () => {
    fs.copyFileSync('tests/data/20190724_bucharest_classification.nc', path.join(inboxSubDir, '20190724_bucharest_classification.nc'))
    return wait(4000)
  })

  it('should respond with correct uuid in metadata JSON', async () => {
    return axios
      .get(`${backendUrl}file/${expectedUuidFromSubFolder}`)
      .then(response => expect(response.data.uuid).toMatch(expectedUuidFromSubFolder))
  })

})
