import { createConnection, Repository, Connection } from 'typeorm'
import { File } from '../../src/entity/File'
import { readFileSync } from 'fs'
import { publicDir, clearDir } from '../lib'
import { Parser } from 'xml2js'
import { putRecord } from '../../src/metadata2db'

const bucharestXml = 'tests/data/20190723_bucharest_classification.xml'
const bucharestXmlMissing = 'tests/data/20190723_bucharest_classification_missing_fields.xml'
const bucharestXmlInvalidLocation = 'tests/data/20190723_bucharest_classification_invalid_location.xml'
const partialLidarXml = 'tests/data/partial_lidar.xml'
const fullLidarXml = 'tests/data/full_lidar.xml'
const granadaXml = 'tests/data/20200126_granada_ecmwf.xml'
const uuid = '15506ea8d3574c7baf8c95dfcc34fc7d'
const lidarUuid = '04ddd0c2f74e481198465c33b95f06af'
const granadaUuid = '9e04d8ef0f2b4823835d33e458403c67'

let conn: Connection
let repo: Repository<File>

beforeAll(async () => {
  conn = await createConnection('test')
  //const repo = conn.getRepository('file')
  //await repo.delete(uuid)
  //return repo.delete(lidarUuid)
})

beforeEach(() => {
  clearDir(publicDir)
})

afterAll(async () => {
  return conn.close()
})

function readJSONIn(filename: string): Promise<string> {
  let parser = new Parser()
  return new Promise((resolve, _) => {
    const xml: string = readFileSync(filename, 'utf-8')
    let out: string
    parser.parseString(xml, function (err:any,  result:any) {
      resolve(result)
  })
  })
}

test('Testing..', async() => {
  readJSONIn(bucharestXml)
  .then(result => {
    return putRecord(conn, result)
  })
  .then(result => {
    expect(result).toMatch('jiihaa')
  })  
})

//test('errors on missing XML fields', async () => {
//  const out = await readXmlIn(bucharestXmlMissing, false)
//  expect(out).toMatch('Failed to import NetCDF XML to DB:')
//  expect(out).toMatch('cloudnet_file_type')
//  return expect(out).toMatch('file_uuid')
//})

/*
test('errors on invalid location', async () => {
  const out = await readXmlIn(bucharestXmlInvalidLocation, false)
  return expect(out).toMatch('Failed to import NetCDF XML to DB:')
})

test('does not overwrite existing stable files', async () => {
  await readXmlIn(bucharestXml, true)
  const now = new Date()
  await repo.update(uuid, { releasedAt: new Date(new Date(now.setDate(now.getDate() - 2))) })
  const out = await readXmlIn(bucharestXml, false)
  expect(out).toMatch('Failed to import NetCDF XML to DB:')
  return expect(out).toMatch('Cannot update a stable file')
})

test('overwrites existing stable files on test site', async () => {
  await readXmlIn(granadaXml, true)
  const now = new Date()
  const oldRelease = (await repo.findOneOrFail(granadaUuid))
  await repo.update(granadaUuid, { releasedAt: new Date(new Date(now.setDate(now.getDate() - 2))) })
  await readXmlIn(granadaXml, true)
  const newRelease = (await repo.findOneOrFail(granadaUuid))
  return expect(oldRelease.releasedAt.getTime()).toBeLessThan(newRelease.releasedAt.getTime())
})

describe('after reading a valid XML', () => {
  let rowN: number
  beforeAll(async () => {
    clearDir(publicDir)
    await repo.delete(uuid)
    rowN = (await repo.find()).length
    return readXmlIn(bucharestXml, true)
  })

  afterAll(async () => {
    await repo.delete(uuid)
    return repo.delete(lidarUuid)
  })

  test('inserts a row to db', async () => {
    return expect(repo.find()).resolves.toHaveLength(rowN + 1)
  })

  test('updates row on partial volatile file update', async () => {
    await readXmlIn(partialLidarXml, true)
    const oldRelease = (await repo.findOneOrFail(lidarUuid))
    await readXmlIn(fullLidarXml, true)
    const newRelease = (await repo.findOneOrFail(lidarUuid))
    expect(oldRelease.size).toBeLessThan(newRelease.size)
    expect(oldRelease.checksum).not.toBe(newRelease.checksum)
    return expect(oldRelease.releasedAt.getTime()).toBeLessThan(newRelease.releasedAt.getTime())
  })
})
*/
