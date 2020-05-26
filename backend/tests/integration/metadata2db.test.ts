import { createConnection, Repository, Connection } from 'typeorm'
import { File } from '../../src/entity/File'
import { readFileSync } from 'fs'
import { publicDir, clearDir } from '../lib'
import { Parser } from 'xml2js'
import { putRecord, freezeRecord } from '../../src/metadata2db'

const bucharestXml = 'tests/data/20190723_bucharest_classification.xml'
const bucharestXmlMissing = 'tests/data/20190723_bucharest_classification_missing_fields.xml'
const bucharestXmlInvalidLocation = 'tests/data/20190723_bucharest_classification_invalid_location.xml'
const granadaXml = 'tests/data/20200126_granada_ecmwf.xml'
const uuid = '15506ea8d3574c7baf8c95dfcc34fc7d'
const lidarUuid = '04ddd0c2f74e481198465c33b95f06af'
const granadaUuid = '9e04d8ef0f2b4823835d33e458403c67'

let conn: Connection
let repo: Repository<File>

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('file')
  await repo.delete(uuid)
  await repo.delete(granadaUuid)
  return repo.delete(lidarUuid)
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
    parser.parseString(xml, function(err:any,  result:any) {
      resolve(result)
    })
  })
}

test('inserting new file', async () => {
  const input = await readJSONIn(bucharestXml)
  const out = await putRecord(conn, input)
  expect(out.status.toString()).toMatch('201')
})

test('updating existing file', async () => {
  const input = await readJSONIn(bucharestXml)
  const out = await putRecord(conn, input)
  expect(out.status.toString()).toMatch('200')
})

test('freezing existing file', async () => {
  const freeze = true
  const pid = 'http://123.123.jeejee'
  const input = await readJSONIn(bucharestXml)
  const out_from_put = await putRecord(conn, input)
  const status = await freezeRecord(out_from_put, conn, pid, freeze)
  expect(status.toString()).toMatch('200')
})

test('refuse updating freezed file', async () => {
  const input = await readJSONIn(bucharestXml)
  try {
    await putRecord(conn, input)
  } catch (e) {
    expect(e).toMatch('Cannot update a non-volatile file.')
  }
})

test('errors on missing header fields', async () => {
  const input = await readJSONIn(bucharestXmlMissing)
  try {
    await putRecord(conn, input)
  } catch (e) {
    let msgs = ['Invalid header fields', 'Missing or invalid:', 'cloudnet_file_type', 'file_uuid']
    msgs.forEach(element => {
      expect(e).toMatch(element)
    })
  }
})

test('errors on invalid location', async () => {
  await repo.delete(uuid)
  const input = await readJSONIn(bucharestXmlInvalidLocation)
  try {
    await putRecord(conn, input)
  } catch (e) {
    expect(e.toString()).toMatch('Could not find any entity of type "Site" matching: "bkrest"')
  }
})

test('overwrites existing freezed files on test site', async () => {
  const freeze = true
  const pid = 'http://123.123.jeejee'
  const input = await readJSONIn(granadaXml)
  const out1 = await putRecord(conn, input)
  const status = await freezeRecord(out1, conn, pid, freeze)
  expect(status.toString()).toMatch('201')
  const out2 = await putRecord(conn, input)
  expect(out2.status.toString()).toMatch('200')
  expect(out1.body.releasedAt < out2.body.releasedAt)
})

