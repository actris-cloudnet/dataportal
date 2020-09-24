import { createConnection, Repository, Connection } from 'typeorm'
import { File } from '../../../src/entity/File'
import { readFileSync } from 'fs'
import { publicDir, clearDir, backendPrivateUrl, parseUuid } from '../../lib'
import axios from 'axios'

const dataDir = 'tests/data/'

const bucharestXml = `${dataDir}20190723_bucharest_classification.xml`
const bucharestXmlNoPid = `${dataDir}20190723_bucharest_classification_no_pid.xml`
const bucharestXmlMissing = `${dataDir}20190723_bucharest_classification_missing_fields.xml`
const bucharestXmlInvalidLocation = `${dataDir}20190723_bucharest_classification_invalid_location.xml`
const bucharestXmlProvenance = `${dataDir}20190723_bucharest_classification_provenance.xml`
const bucharestXmlInvalidProvenance = `${dataDir}20190723_bucharest_classification_provenance.xml`
const granadaXml = `${dataDir}20200126_granada_ecmwf.xml`

const uuid = '15506ea8d3574c7baf8c95dfcc34fc7d'
const granadaUuid = '9e04d8ef0f2b4823835d33e458403c67'
const provenanceUuid = '55506ea8d3574c7baf8c95dfcc34fc7d'

let conn: Connection
let repo: Repository<File>

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('file')
  await repo.delete(uuid)
  await repo.delete(granadaUuid)
  await repo.delete(provenanceUuid)
  return
})

beforeEach(() => {
  clearDir(publicDir)
})

afterAll(async () => {
  await repo.delete(uuid)
  await repo.delete(provenanceUuid)
  await conn.close()
  return
})

async function putFile(xmlFileName:string, headers:any) {
  const xml = readFileSync(xmlFileName, 'utf-8')
  const uuid = await parseUuid(xml)
  const url = `${backendPrivateUrl}files/${uuid}`
  return await axios.put(url, xml, {headers: headers})
}

test('inserting new file', async () => {
  const out = await putFile(bucharestXmlNoPid, { 'Content-Type': 'application/xml' })
  expect(out.status.toString()).toMatch('201')
  return expect(repo.findOneOrFail(uuid)).resolves.toBeTruthy()
})

test('updating existing file', async () => {
  const out = await putFile(bucharestXmlNoPid, { 'Content-Type': 'application/xml' })
  expect(out.status.toString()).toMatch('200')
  const dbRow1 = await repo.findOneOrFail(uuid)
  await putFile(bucharestXml, { 'Content-Type': 'application/xml' })
  const dbRow2 = await repo.findOneOrFail(uuid)
  expect(dbRow1.releasedAt < dbRow2.releasedAt)
})

test('refuse freezing a file without pid', async () => {
  try {
    await putFile(bucharestXmlNoPid, { 'Content-Type': 'application/xml', 'X-Freeze': 'True' })
  } catch (e) {
    expect(e.response.data.status.toString()).toMatch('500')
    expect(e.response.data.errors[0]).toMatch('Tried to freeze a file with no PID')
  }
})

test('freezing existing file', async () => {
  let dbRow = await repo.findOneOrFail(uuid)
  expect(dbRow.volatile.toString()).toMatch('true')
  const out = await putFile(bucharestXml, { 'Content-Type': 'application/xml', 'X-Freeze': 'True' })
  expect(out.status.toString()).toMatch('200')
  dbRow = await repo.findOneOrFail(uuid)
  expect(dbRow.volatile.toString()).toMatch('false')
  expect(dbRow.pid).toEqual('http://pid-server.com/sdfsfoweirweir234234')
})

test('refuse updating freezed file', async () => {
  try {
    await putFile(bucharestXml, { 'Content-Type': 'application/xml', 'X-Freeze': 'True' })
  } catch (e) {
    expect(e.response.data.status.toString()).toMatch('403')
    expect(e.response.data.errors[0]).toMatch('File exists and cannot be updated since it is freezed and not from a test site')
  }
})

test('errors on missing header fields', async () => {
  try {
    await putFile(bucharestXmlMissing, { 'Content-Type': 'application/xml' })
  } catch (e) {
    expect(e.response.data.status.toString()).toMatch('500')
    expect(e.response.data.errors[0]).toMatch('Invalid header fields')
  }
})

test('errors on invalid location', async () => {
  await repo.delete(uuid).catch()
  try {
    await putFile(bucharestXmlInvalidLocation, { 'Content-Type': 'application/xml' })
  } catch (e) {
    expect(e.response.data.status.toString()).toMatch('500')
    expect(e.response.data.errors.message).toMatch('Could not find any entity of type "Site" matching: "bkrest"')
  }
})

test('overwrites existing freezed files on test site', async () => {
  const out1 = await putFile(granadaXml, { 'Content-Type': 'application/xml', 'X-Freeze': 'True' })
  expect(out1.status.toString()).toMatch('201')
  const dbRow1 = await repo.findOneOrFail(granadaUuid)
  const out2 = await putFile(granadaXml, { 'Content-Type': 'application/xml'})
  expect(out2.status.toString()).toMatch('200')
  const dbRow2 = await repo.findOneOrFail(granadaUuid)
  expect(dbRow1.releasedAt < dbRow2.releasedAt)
  // Reset db (granada metadata is in fixtures)
  return repo
    .createQueryBuilder()
    .update()
    .set({ pid: '', volatile: true})
    .where('uuid = :uuid', { uuid: granadaUuid })
    .execute()
})

test('inserting new file with source files', async () => {
  const out = await putFile(bucharestXmlProvenance, { 'Content-Type': 'application/xml' })
  expect(out.status.toString()).toMatch('201')
  const provenanceFile = await repo.findOneOrFail(provenanceUuid)
  return expect(provenanceFile.sourceFileIds).toMatchObject(['22b32746-faf0-4057-9076-ed2e698dcc34', '6cb32746-faf0-4057-9076-ed2e698dcf36'])
})

test('errors on nonexisting source files', async () => {
  try {
    await repo.delete(provenanceUuid)
    await putFile(bucharestXmlInvalidProvenance, { 'Content-Type': 'application/xml' })
  } catch (e) {
    expect(e.response.data.status.toString()).toMatch('500')
  }
})
