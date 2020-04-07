import { File } from '../../src/entity/File'
import { createConnection, Repository, Connection } from 'typeorm'
import { readFileSync, } from 'fs'
import { spawn } from 'child_process'
import { publicDir, clearDir } from '../lib'

const bucharestXml = 'tests/data/20190723_bucharest_classification.xml'
const bucharestXmlMissing = 'tests/data/20190723_bucharest_classification_missing_fields.xml'
const bucharestXmlInvalidLocation = 'tests/data/20190723_bucharest_classification_invalid_location.xml'
const partialLidarXml = 'tests/data/partial_lidar.xml'
const fullLidarXml = 'tests/data/full_lidar.xml'
const uuid = '15506ea8d3574c7baf8c95dfcc34fc7d'
const lidarUuid = '04ddd0c2f74e481198465c33b95f06af'

let conn: Connection
let repo: Repository<File>

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository(File)
  await repo.delete(uuid)
  return repo.delete(lidarUuid)
})

beforeEach(() => {
  clearDir(publicDir)
})

afterAll(async () => {
  return conn.close()
})

function readXmlIn(filename: string, logErrors: boolean): Promise<string> {
  return new Promise((resolve, _) => {
    const xml: string = readFileSync(filename, 'utf-8')
    const proc = spawn('node', ['--no-warnings', 'build/metadata2db.js'])
    let out: string
    proc.stderr.on('data', data => {
      if (logErrors) console.error(data.toString())
      out += data
    })
    proc.on('exit', () => resolve(out))
    proc.stdin.write(xml)
    proc.stdin.end()
  })
}

test('errors on missing XML fields', async () => {
  const out = await readXmlIn(bucharestXmlMissing, false)
  expect(out).toMatch('Failed to import NetCDF XML to DB:')
  expect(out).toMatch('cloudnet_file_type')
  return expect(out).toMatch('file_uuid')
})

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
