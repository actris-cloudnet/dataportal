import * as fs from 'fs'
import axios from 'axios'
import {backendPrivateUrl, backendPublicUrl, storageServiceUrl} from '../lib'
import * as AdmZip from 'adm-zip'
import {createHash} from 'crypto'
import {Connection, createConnection, Repository} from 'typeorm'
import {Download} from '../../src/entity/Download'
import {basename} from 'path'

let conn: Connection
let repo: Repository<Download>

beforeAll(async () => {
  conn = await createConnection('test')
  await conn.getRepository('download').delete({})
  await conn.getRepository('visualization').delete({})
  await conn.getRepository('file').delete({})
  repo = conn.getRepository('download')
})

afterAll(async () => {
  await conn.getRepository('download').delete({})
  await conn.getRepository('visualization').delete({})
  await conn.getRepository('file').delete({})
  await conn.close()
})


const inputJson = {
  'uuid': '15506ea8-d357-4c7b-af8c-95dfcc34fc7d',
  'measurementDate': '2019-07-23',
  'history': '2019-09-16 11:21:13 - classification file created\n2019-09-16 11:21:02 - categorize file created\n2019-09-16 11:20:30 - radar file created\nLidar backscatter derived from raw values in arbitrary units: calibrated by user Ewan O\'Connor <ewan.oconnor@fmi.fi> on 25-Jul-2019.',
  'cloudnetpyVersion': '1.0.4',
  'filename': '20190723_bucharest_classification.nc',
  'checksum': 'b77b731aaae54f403aae6765ad1d20e1603b4454e2bc0d461aab4985a4a82ca4',
  'size': 139021,
  'format': 'HDF5 (NetCDF4)',
  'product': 'classification',
  'site': 'bucharest',
  'volatile': true,
  'version': '1234'
}

const inputJson2 = {
  'uuid': '25506ea8-d357-4c7b-af8c-95dfcc34fc7d',
  'measurementDate': '2019-07-24',
  'history': '2019-09-16 11:21:13 - classification file created\n2019-09-16 11:21:02 - categorize file created\n2019-09-16 11:20:30 - radar file created\nLidar backscatter derived from raw values in arbitrary units: calibrated by user Ewan O\'Connor <ewan.oconnor@fmi.fi> on 25-Jul-2019.',
  'cloudnetpyVersion': '1.0.4',
  'filename': '20190724_bucharest_classification.nc',
  'checksum': '6904509c9e03154d9c831aaa8595e01eb5339110e842a34e16f24ffb4456e061',
  'size': 139021,
  'format': 'HDF5 (NetCDF4)',
  'product': 'classification',
  'site': 'bucharest',
  'volatile': true,
  'version': '1234'
}

const expectedJson = {
  'uuid': '15506ea8-d357-4c7b-af8c-95dfcc34fc7d',
  'measurementDate': '2019-07-23',
  'history': '2019-09-16 11:21:13 - classification file created\n2019-09-16 11:21:02 - categorize file created\n2019-09-16 11:20:30 - radar file created\nLidar backscatter derived from raw values in arbitrary units: calibrated by user Ewan O\'Connor <ewan.oconnor@fmi.fi> on 25-Jul-2019.',
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
  },
  'volatile': true,
  'version': '1234'
}

const filepath = 'tests/data/20190723_bucharest_classification.nc'
const s3key = `something/${basename(filepath)}`

describe('after PUTting metadata to API', () => {
  beforeAll(async () => {
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${s3key}`, fs.createReadStream(filepath))
    return axios.put(`${backendPrivateUrl}files/${s3key}`, inputJson)
  })

  it('responds with a corresponding metadata JSON', async () => {
    return axios
      .get(`${backendPublicUrl}files/${inputJson.uuid}`)
      .then(response => expect(response.data).toMatchObject(expectedJson))
  })

  it('serves the file and increases download count', async () => {
    return axios
      .get(`${backendPublicUrl}download/product/${expectedJson.uuid}/${s3key}`, {responseType: 'arraybuffer'})
      .then(response => {
        expect(response.status).toEqual(200)
        const hash = createHash('sha256')
        hash.update(response.data)
        expect(hash.digest('hex')).toEqual(expectedJson.checksum)
        return expect(repo.findOne({objectUuid: expectedJson.uuid})).resolves.toBeTruthy()
      })
  })

  it('responds with 400 if file not uploaded', async () => {
    return expect(axios.put(`${backendPrivateUrl}files/notfound`, inputJson)).rejects.toMatchObject({response: {status: 400}})
  })

  describe('after PUTting more metadata to API', () => {
    let collectionUuid = ''
    beforeAll(async () => {
      const filepath = 'tests/data/20190724_bucharest_classification.nc'
      const s3key = basename(filepath)
      await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${s3key}`, fs.createReadStream(filepath))
      await axios.put(`${backendPrivateUrl}files/${s3key}`, inputJson2)
      const res =  await axios.post(`${backendPublicUrl}collection/`, {files: [expectedJson.uuid, inputJson2.uuid]})
      collectionUuid = res.data
    })

    it('hashes of /download zipped files match originals and collection download count increases', async () => {
      const tmpZip = 'tests/data/tmp.zip'
      const expectedShas = await (await axios.get(`${backendPublicUrl}files/`, { params: { site: 'bucharest' } })).data.map((file: any) => file.checksum)
      const receivedFile = await axios.get(`${backendPublicUrl}download/collection/${collectionUuid}`, { responseType: 'arraybuffer'})
      fs.writeFileSync(tmpZip, receivedFile.data)
      const shas = new AdmZip(tmpZip).getEntries().map(entry => {
        const hash = createHash('sha256')
        hash.update(entry.getData())
        return hash.digest('hex')
      })
      expect(shas.sort()).toMatchObject(expectedShas.sort())
      fs.unlinkSync(tmpZip)
      return expect(repo.findOne({objectUuid: collectionUuid})).resolves.toBeTruthy()
    })
  })
})
