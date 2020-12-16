import {Connection, createConnection, Repository} from 'typeorm'
import {File} from '../../../src/entity/File'
import {readFileSync} from 'fs'
import {backendPrivateUrl, storageServiceUrl} from '../../lib'
import axios from 'axios'
import {Visualization} from '../../../src/entity/Visualization'
import {SearchFile} from '../../../src/entity/SearchFile'


let conn: Connection
let fileRepo: Repository<File>
let searchFileRepo: Repository<SearchFile>
let vizRepo: Repository<Visualization>
const volatileFile = JSON.parse(readFileSync('tests/data/file.json', 'utf8'))
const stableFile  = {...volatileFile, ...{volatile: false, pid: '1234'}}

beforeAll(async () => {
  conn = await createConnection('test')
  fileRepo = conn.getRepository('file')
  searchFileRepo = conn.getRepository('search_file')
  vizRepo = conn.getRepository('visualization')
  return Promise.all([
    axios.put(`${storageServiceUrl}cloudnet-product-volatile/${volatileFile.s3key}`, 'content'),
    axios.put(`${storageServiceUrl}cloudnet-product/${stableFile.s3key}`, 'content')
  ])
})

beforeEach(async () => {
  await vizRepo.delete({})
  await searchFileRepo.delete({})
  return fileRepo.delete({})
})

afterAll(async () => {
  await vizRepo.delete({})
  await fileRepo.delete({})
  await conn.close()
})

async function putFile(json: any) {
  const url = `${backendPrivateUrl}files/${json.s3key}`
  return await axios.put(url, json)
}

describe('PUT /files/:s3key', () => {
  test('inserting new volatile file', async () => {
    await expect(putFile(volatileFile)).resolves.toMatchObject({status: 201})
    await expect(searchFileRepo.findOneOrFail({where: {uuid: volatileFile.uuid}})).resolves.toBeTruthy()
    return expect(fileRepo.findOneOrFail(volatileFile.uuid)).resolves.toBeTruthy()
  })

  test('updating existing volatile file', async () => {
    await expect(putFile(volatileFile)).resolves.toMatchObject({status: 201})
    const dbRow1 = await fileRepo.findOneOrFail(volatileFile.uuid)
    await expect(putFile(volatileFile)).resolves.toMatchObject({status: 200})
    const dbRow2 = await fileRepo.findOneOrFail(volatileFile.uuid)
    await expect(searchFileRepo.findOneOrFail({where: {uuid: volatileFile.uuid}})).resolves.toBeTruthy()
    expect(dbRow1.createdAt).toEqual(dbRow2.createdAt)
    expect(dbRow1.updatedAt < dbRow2.updatedAt)
  })

  test('inserting new version of an existing freezed file', async () => {
    await expect(putFile(stableFile)).resolves.toMatchObject({status: 201})
    const newVersion = {...stableFile,
      ...{
        uuid: '3cf275bb-5b09-42ec-8784-943fe2a745f6',
        checksum: '510980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'
      }
    }
    await expect(putFile(newVersion)).resolves.toMatchObject({status: 200})
    await expect(fileRepo.findOneOrFail({where: {uuid: newVersion.uuid}})).resolves.toBeTruthy()
    await expect(searchFileRepo.findOneOrFail({where: {uuid: stableFile.uuid}})).rejects
      .toBeTruthy()
    return expect(searchFileRepo.findOneOrFail({where: {uuid: newVersion.uuid}})).resolves
      .toBeTruthy()
  })

  test('inserting legacy file', async () => {
    const tmpfile = {...volatileFile}
    tmpfile.legacy = true
    await expect(putFile(tmpfile)).resolves.toMatchObject({status: 201})
    await expect(fileRepo.findOneOrFail(volatileFile.uuid)).resolves.toMatchObject({legacy: true})
    return expect(searchFileRepo.findOneOrFail(volatileFile.uuid)).resolves.toMatchObject({legacy: true})
  })

  test('inserting two model files', async () => {
    const tmpfile1 = {...volatileFile}
    tmpfile1.product = 'model'
    tmpfile1.model = 'icon-iglo-12-23'
    const tmpfile2 = {...tmpfile1}
    tmpfile2.model = 'ecmwf'
    tmpfile2.uuid = '87EB042E-B247-4AC1-BC03-074DD0D74BDB'
    tmpfile2.s3key = 'icomodel.nc'
    tmpfile2.checksum = '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'
    await expect(putFile(tmpfile1)).resolves.toMatchObject({status: 201})
    await expect(fileRepo.findOneOrFail(tmpfile1.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile1.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, 'content')
    await expect(putFile(tmpfile2)).resolves.toMatchObject({status: 201})
    await expect(fileRepo.findOneOrFail(tmpfile2.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile2.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeFalsy()
    return expect(searchFileRepo.findOne(tmpfile2.uuid)).resolves.toBeTruthy()
  })

  test('errors on invalid site', async () => {
    const tmpfile = {...stableFile}
    tmpfile.site = 'Bökärest'
    return expect(putFile(tmpfile)).rejects.toMatchObject({response: { status: 500}})
  })

  test('overwrites existing freezed files on test site', async () => {
    const tmpfile = {...stableFile}
    tmpfile.site = 'granada'
    await putFile(tmpfile)
    const dbRow1 = await fileRepo.findOneOrFail(stableFile.uuid)
    await expect(putFile(tmpfile)).resolves.toMatchObject({status: 200})
    const dbRow2 = await fileRepo.findOneOrFail(stableFile.uuid)
    expect(dbRow1.updatedAt < dbRow2.updatedAt)
  })

  test('inserting new file with source files', async () => {
    await putFile(stableFile)
    const tmpfile = {...stableFile}
    tmpfile.sourceFileIds = [stableFile.uuid]
    tmpfile.uuid = '62b32746-faf0-4057-9076-ed2e698dcc34'
    tmpfile.checksum = 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5'
    tmpfile.s3key = 'sourcefiles.nc'
    await axios.put(`${storageServiceUrl}cloudnet-product/${tmpfile.s3key}`, 'content')
    await expect(putFile(tmpfile)).resolves.toMatchObject({status: 201})
    const dbRow1 = await fileRepo.findOneOrFail(tmpfile.uuid)
    return expect(dbRow1.sourceFileIds).toMatchObject([stableFile.uuid])
  })

  test('errors on nonexisting source files', async () => {
    await putFile(stableFile)
    const tmpfile = {...stableFile}
    tmpfile.sourceFileIds = ['42b32746-faf0-4057-9076-ed2e698dcc34']
    tmpfile.uuid = '22b32746-faf0-4057-9076-ed2e698dcc34'
    tmpfile.checksum = 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5'
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: {status: 422}})
  })
})

describe('POST /files/', () => {

  test('refuse freezing a file without pid', async () => {
    const tmpfile = {...stableFile}
    delete tmpfile.pid
    return expect(putFile(tmpfile)).rejects.toMatchObject({response: { status: 422}})
  })

  test('freezing existing file', async () => {
    await putFile(volatileFile)
    const payload = {uuid: volatileFile.uuid, volatile: false, pid: '1234', checksum: 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5'}
    await expect(axios.post(`${backendPrivateUrl}files/`, payload)).resolves.toMatchObject({status: 200})
    const dbRow = await fileRepo.findOneOrFail(volatileFile.uuid)
    const dbRow2 = await searchFileRepo.findOneOrFail(volatileFile.uuid)
    expect(dbRow.volatile).toEqual(false)
    expect(dbRow.pid).toEqual(payload.pid)
    expect(dbRow.checksum).toEqual(payload.checksum)
    expect(dbRow2.volatile).toEqual(false)
  })

  test('refuse updating freezed file', async () => {
    await putFile(stableFile)
    return expect(putFile(stableFile)).rejects.toMatchObject({response: {status: 403, data: { errors: ['File exists and cannot be updated since it is freezed and not from a test site']}}})
  })
})
