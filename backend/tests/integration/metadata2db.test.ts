import { File } from '../../src/entity/File'
import { createConnection, Repository, Connection } from 'typeorm'
import { readFileSync, openSync, closeSync, statSync } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import { publicDir, clearDir } from '../lib'

const bucharestXml = 'tests/data/20190723_bucharest_classification.xml'
const bucharestXmlMissing = 'tests/data/20190723_bucharest_classification_missing_fields.xml'
const bucharestXmlInvalidLocation = 'tests/data/20190723_bucharest_classification_invalid_location.xml'
const uuid = '15506ea8d3574c7baf8c95dfcc34fc7d'

let conn: Connection
let repo: Repository<File>

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository(File)
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

test('does not overwrite existing files', async () => {
  await repo.delete(uuid) // Delete corresponding db row
  const file = join(publicDir, '20190723_bucharest_classification.nc')
  closeSync(openSync(file, 'w'))
  const out = await readXmlIn(bucharestXml, false)
  expect(out).toMatch('Failed to import NetCDF XML to DB:')
  expect(statSync(file).size).toBe(0)
})

describe('after reading a valid XML', () => {
  let rowN: number
  beforeAll(async () => {
    clearDir(publicDir)
    rowN = (await repo.find()).length
    return readXmlIn(bucharestXml, true)
  })

  afterAll(() => repo.delete(uuid))

  test('inserts a row to db', async () => {
    return expect(repo.find()).resolves.toHaveLength(rowN + 1)
  })

  test('errors when inserting XML with same UUID', async () => {
    const out = await readXmlIn(bucharestXml, false)
    expect(out).toMatch('Failed to import NetCDF XML to DB:')
    return expect(repo.find()).resolves.toHaveLength(rowN + 1)
  })
})
