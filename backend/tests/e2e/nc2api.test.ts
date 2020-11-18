import * as fs from 'fs'
import axios from 'axios'
import { clearDir, publicDir, clearRepo, backendPrivateUrl, backendPublicUrl, runNcdump } from '../lib'
import * as AdmZip from 'adm-zip'
import { createHash } from 'crypto'
import * as express from 'express'
import {Server} from 'http'
import {Connection, createConnection, Repository} from 'typeorm'
import {Download} from '../../src/entity/Download'

let conn: Connection
let repo: Repository<Download>

let server: Server
let serverMemory: any = {}
beforeAll(next => {
  Promise.all([
    createConnection('test'),
    clearRepo('download'),
    clearRepo('visualization'),
    clearRepo('file')
  ]).then(([newConn, _1, _2]) => {
    conn = newConn
    repo = conn.getRepository('download')
    const app = express()
    app.put('/*', (req, res, _next) =>{
      const path = req.params[0]
      serverMemory[path] = new Buffer(0)
      req.on('data', chunk => (serverMemory[path] = Buffer.concat([serverMemory[path], chunk])))
      req.on('error', console.error)
      req.on('end', () => res.sendStatus(201))
    })
    app.get('/*', (req, res, _next) =>{
      res.send(serverMemory[req.params[0]])
    })
    server = app.listen(5910, next)
    return
  })
})

afterAll(next => {
  clearRepo('download').then(() =>
  clearRepo('visualization')).then(() =>
  clearRepo('file')).then(() =>
  conn.close().then(() =>
  server.close(() => next())))
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
  },
  'volatile': true
}

const axiosConfig = { headers: { 'content-type': 'application/xml'}}

describe('after PUTting metadata to API', () => {
  beforeAll(async () => {
    const filepath = 'tests/data/20190723_bucharest_classification.nc'
    const xmlOut = await runNcdump(filepath)
    await axios.put(`${backendPrivateUrl}files/${expectedJson.uuid}`, xmlOut, axiosConfig)
    return axios.put(`http://localhost:5910/cloudnet-product/${expectedJson.uuid}`, fs.createReadStream(filepath))
  })

  it('responds with a corresponding metadata JSON', async () => {
    return axios
      .get(`${backendPublicUrl}files/${expectedJson.uuid}`)
      .then(response => expect(response.data).toMatchObject(expectedJson))
  })

  it('serves the file and increases download count', async () => {
    return axios
      .get(`${backendPublicUrl}download/product/${expectedJson.uuid}/${expectedJson.filename}`, {responseType: 'arraybuffer'})
      .then(response => {
        expect(response.status).toEqual(200)
        const hash = createHash('sha256')
        hash.update(response.data)
        expect(hash.digest('hex')).toEqual(expectedJson.checksum)
        return expect(repo.findOne({objectUuid: expectedJson.uuid})).resolves.toBeTruthy()
      })
  })

  describe('after PUTting more metadata to API', () => {
    let collectionUuid = ''
    beforeAll(async () => {
      const uuid = '926ba5cb19e241538d879d97596f5574'
      const filepath = 'tests/data/20190724_bucharest_classification.nc'
      const xmlOut = await runNcdump(filepath)
      await axios.put(`${backendPrivateUrl}files/${uuid}`, xmlOut, axiosConfig)
      await axios.put(`http://localhost:5910/cloudnet-product/${uuid}`, fs.createReadStream(filepath))
      const res =  await axios.post(`${backendPublicUrl}collection/`, {files: [expectedJson.uuid, uuid]})
      collectionUuid = res.data
    })

    it('hashes of /download zipped files match originals and collection download count increases', async () => {
      const tmpZip = 'tests/data/tmp.zip'
      const now = new Date().getTime()
      const shas = await (await axios.get(`${backendPublicUrl}files/`, { params: { location: 'bucharest' } })).data.map((file: any) => file.checksum)
      const receivedFile = await axios.get(`${backendPublicUrl}download/collection/${collectionUuid}`, { responseType: 'arraybuffer'})
      fs.writeFileSync(tmpZip, receivedFile.data)
      new AdmZip(tmpZip).getEntries().map((entry, i) => {
        const hash = createHash('sha256')
        hash.update(entry.getData())
        expect(hash.digest('hex')).toEqual(shas[shas.length - 1 - i])
      })
      fs.unlinkSync(tmpZip)
      return expect(repo.findOne({objectUuid: collectionUuid})).resolves.toBeTruthy()
    })
  })
})
