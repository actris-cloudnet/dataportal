import {Connection, createConnection, Repository} from 'typeorm'
import {ModelFile, RegularFile} from '../../../src/entity/File'
import {readFileSync} from 'fs'
import {backendPrivateUrl, storageServiceUrl} from '../../lib'
import axios from 'axios'
import {Visualization} from '../../../src/entity/Visualization'
import {SearchFile} from '../../../src/entity/SearchFile'
import {ModelVisualization} from '../../../src/entity/ModelVisualization'


let conn: Connection
let fileRepo: Repository<RegularFile>
let modelFileRepo: Repository<ModelFile>
let searchFileRepo: Repository<SearchFile>
let vizRepo: Repository<Visualization>
let modelVizRepo: Repository<ModelVisualization>

const volatileFile = JSON.parse(readFileSync('tests/data/file.json', 'utf8'))
const stableFile  = {...volatileFile, ...{volatile: false, pid: '1234'}}
const volatileModelFile = {...volatileFile, ...{model: 'ecmwf', product: 'model'}}

beforeAll(async () => {
  conn = await createConnection()
  fileRepo = conn.getRepository('regular_file')
  modelFileRepo = conn.getRepository('model_file')
  searchFileRepo = conn.getRepository('search_file')
  vizRepo = conn.getRepository('visualization')
  modelVizRepo = conn.getRepository('model_visualization')
  return Promise.all([
    axios.put(`${storageServiceUrl}cloudnet-product-volatile/${volatileFile.s3key}`, 'content'),
    axios.put(`${storageServiceUrl}cloudnet-product/${stableFile.s3key}`, 'content'),
    axios.put(`${storageServiceUrl}cloudnet-product/legacy/${stableFile.s3key}`, 'content')
  ])
})

beforeEach(async () => {
  await vizRepo.delete({})
  await modelVizRepo.delete({})
  await searchFileRepo.delete({})
  await modelFileRepo.delete({})
  return fileRepo.delete({})
})

afterAll(async () => {
  await vizRepo.delete({})
  await modelVizRepo.delete({})
  await modelFileRepo.delete({})
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

  test('inserting a normal file and a legacy file', async () => {
    await expect(putFile(stableFile)).resolves.toMatchObject({status: 201})
    const tmpfile = {...stableFile}
    tmpfile.legacy = true
    tmpfile.uuid = '87EB042E-B247-4AC1-BC03-074DD0D74BDB'
    tmpfile.s3key = `legacy/${stableFile.s3key}`
    tmpfile.checksum = '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'
    await expect(putFile(tmpfile)).resolves.toMatchObject({status: 200})
    await expect(searchFileRepo.findOneOrFail(stableFile.uuid)).resolves.toMatchObject({legacy: false})
    return expect(searchFileRepo.findOneOrFail(tmpfile.uuid)).rejects.toBeTruthy()
  })

  test('inserting a legacy file and a normal file', async () => {
    const tmpfile = {...stableFile}
    tmpfile.legacy = true
    tmpfile.uuid = '87EB042E-B247-4AC1-BC03-074DD0D74BDB'
    tmpfile.s3key = `legacy/${stableFile.s3key}`
    tmpfile.checksum = '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'
    await expect(putFile(tmpfile)).resolves.toMatchObject({status: 201})
    await expect(putFile(stableFile)).resolves.toMatchObject({status: 200})
    await expect(searchFileRepo.findOneOrFail(stableFile.uuid)).resolves.toMatchObject({legacy: false})
    return expect(searchFileRepo.findOneOrFail(tmpfile.uuid)).rejects.toBeTruthy()
  })

  test('inserting a legacy file and two normal files', async () => {
    const tmpfile = {...stableFile}
    tmpfile.legacy = true
    tmpfile.uuid = '87EB042E-B247-4AC1-BC03-074DD0D74BDB'
    tmpfile.s3key = `legacy/${stableFile.s3key}`
    tmpfile.checksum = '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'
    const tmpfile2 = {...stableFile}
    tmpfile2.uuid = '97EB042E-B247-4AC1-BC03-074DD0D74BDB'
    tmpfile2.checksum = '010980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'
    await expect(putFile(tmpfile)).resolves.toMatchObject({status: 201})
    await expect(putFile(stableFile)).resolves.toMatchObject({status: 200})
    await expect(putFile(tmpfile2)).resolves.toMatchObject({status: 200})
    await expect(searchFileRepo.findOneOrFail(stableFile.uuid)).rejects.toBeTruthy()
    await expect(searchFileRepo.findOneOrFail(tmpfile.uuid)).rejects.toBeTruthy()
    return expect(searchFileRepo.findOneOrFail(tmpfile2.uuid)).resolves.toMatchObject({legacy: false})
  })

  test('inserting two model files (first worse, then better)', async () => {
    const tmpfile1 = {...volatileFile,
      product: 'model',
      model: 'icon-iglo-12-23'}
    const tmpfile2 = {...tmpfile1,
      model: 'ecmwf',
      uuid: '87EB042E-B247-4AC1-BC03-074DD0D74BDB',
      s3key: '20181115_mace-head_ecmwf.nc',
      checksum: '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'}
    await expect(putFile(tmpfile1)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile1.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile1.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, 'content')
    await expect(putFile(tmpfile2)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile2.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile2.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeFalsy()
    return expect(searchFileRepo.findOne(tmpfile2.uuid)).resolves.toBeTruthy()
  })

  test('inserting two model files (first better, then worse)', async () => {
    const tmpfile1 = {...volatileFile,
      product: 'model',
      model: 'ecmwf'}
    const tmpfile2 = {...tmpfile1,
      model: 'icon-iglo-24-35',
      uuid: '87EB042E-B247-4AC1-BC03-074DD0D74BDB',
      s3key: '20181115_mace-head_icon-iglo-24-35.nc',
      checksum: '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'}
    await expect(putFile(tmpfile1)).resolves.toMatchObject({status: 201})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, 'content')
    await expect(putFile(tmpfile2)).resolves.toMatchObject({status: 201})
    await expect(searchFileRepo.findOne(tmpfile2.uuid)).resolves.toBeFalsy()
    return expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
  })

  test('inserting several model files with different optimumOrder', async () => {
    const tmpfile1 = {...volatileFile,
      product: 'model',
      model: 'icon-iglo-24-35'}
    const tmpfile2 = {...tmpfile1,
      model: 'icon-iglo-36-47',
      uuid: '87EB042E-B247-4AC1-BC03-074DD0D74BDB',
      s3key: '20181115_mace-head_icon-iglo-36-47.nc',
      checksum: '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'}
    const tmpfile3 = {...tmpfile1,
      model: 'ecmwf',
      uuid: 'abde0a2a-40e7-4463-9266-06f50153d974',
      s3key: '20181115_mace-head_ecmwf.nc',
      checksum: 'deb5a92691553bcac4cfb57f5917d7cbf9ccfae9592c40626d9615bd64ebeffe'}
    await expect(putFile(tmpfile1)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile1.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile1.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, 'content')
    await expect(putFile(tmpfile2)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile2.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile2.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeFalsy()
    await expect(searchFileRepo.findOne(tmpfile2.uuid)).resolves.toBeTruthy()
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile3.s3key}`, 'content')
    await expect(putFile(tmpfile3)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile3.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile3.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeFalsy()
    await expect(searchFileRepo.findOne(tmpfile2.uuid)).resolves.toBeFalsy()
    return expect(searchFileRepo.findOne(tmpfile3.uuid)).resolves.toBeTruthy()
  })

  test('inserting several model files with different optimumOrder II', async () => {
    const tmpfile1 = {...volatileFile,
      product: 'model',
      model: 'ecmwf'}
    const tmpfile2 = {...volatileFile,
      product: 'model',
      model: 'gdas1',
      uuid: 'abde0a2a-40e7-4463-9266-06f50153d974',
      s3key: '20181115_mace-head_gdas1.nc',
      checksum: 'deb5a92691553bcac4cfb57f5917d7cbf9ccfae9592c40626d9615bd64ebeffe'}
    const tmpfile3 = {...tmpfile1,
      model: 'icon-iglo-36-47',
      uuid: '87EB042E-B247-4AC1-BC03-074DD0D74BDB',
      s3key: '20181115_mace-head_icon-iglo-36-47.nc',
      checksum: '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'}
    await expect(putFile(tmpfile1)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile1.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile1.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile2.s3key}`, 'content')
    await expect(putFile(tmpfile2)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile2.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile2.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
    await expect(searchFileRepo.findOne(tmpfile2.uuid)).resolves.toBeFalsy()
    await axios.put(`${storageServiceUrl}cloudnet-product-volatile/${tmpfile3.s3key}`, 'content')
    await expect(putFile(tmpfile3)).resolves.toMatchObject({status: 201})
    await expect(modelFileRepo.findOneOrFail(tmpfile3.uuid, {relations: ['model']})).resolves.toMatchObject({model: {id: tmpfile3.model}})
    await expect(searchFileRepo.findOne(tmpfile1.uuid)).resolves.toBeTruthy()
    await expect(searchFileRepo.findOne(tmpfile2.uuid)).resolves.toBeFalsy()
    return await expect(searchFileRepo.findOne(tmpfile3.uuid)).resolves.toBeFalsy()
  })

  test('errors on invalid site', async () => {
    const tmpfile = {...stableFile}
    tmpfile.site = 'bökärest'
    return expect(putFile(tmpfile)).rejects.toMatchObject({response: { status: 400}})
  })

  test('overwrites existing freezed files on test site', async () => {
    const tmpfile = {...stableFile}
    tmpfile.site = 'granada'
    tmpfile.s3key = '20181115_granada_mira.nc'
    await axios.put(`${storageServiceUrl}cloudnet-product/${tmpfile.s3key}`, 'content'),
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
    tmpfile.s3key = '20181115_mace-head_hatpro.nc'
    tmpfile.product = 'categorize'
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

  test('errors on model versions', async () => {
    const tmpfile1 = {...stableFile}
    tmpfile1.product = 'model'
    tmpfile1.model = 'ecmwf'
    const tmpfile2 = {...tmpfile1}
    tmpfile2.uuid = '87EB042E-B247-4AC1-BC03-074DD0D74BDB'
    tmpfile2.checksum = '610980aa2bfe48b4096101113c2c0a8ba97f158da9d2ba994545edd35ab77678'
    await expect(putFile(tmpfile1)).resolves.toMatchObject({status: 201})
    return expect(putFile(tmpfile2)).rejects.toMatchObject({response: {status: 501}})
  })

  test('errors on invalid filename', async () => {
    // filename: 20181115_mace-head_mira.nc
    let tmpfile = {...volatileFile}
    tmpfile.measurementDate = '2018-11-16'
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: {status: 400}})
    tmpfile = {...volatileFile}
    tmpfile.site = 'hyytiala'
    await expect(putFile(tmpfile)).rejects.toMatchObject({ response: {status: 400}})
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

  test('freezing existing model file', async () => {
    await putFile(volatileModelFile)
    const payload = {uuid: volatileModelFile.uuid, volatile: false, pid: '1234', checksum: 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5'}
    await expect(axios.post(`${backendPrivateUrl}files/`, payload)).resolves.toMatchObject({status: 200})
    const dbRow = await modelFileRepo.findOneOrFail(volatileModelFile.uuid)
    const dbRow2 = await searchFileRepo.findOneOrFail(volatileModelFile.uuid)
    expect(dbRow.volatile).toEqual(false)
    expect(dbRow.pid).toEqual(payload.pid)
    expect(dbRow.checksum).toEqual(payload.checksum)
    expect(dbRow2.volatile).toEqual(false)
  })

  test('refuse updating freezed file', async () => {
    await putFile(stableFile)
    return expect(putFile(stableFile)).rejects.toMatchObject({response: {status: 403, data: { errors: ['File exists and cannot be updated since it is freezed and not from a test site']}}})
  })

  test('updating version id does not update updatedAt', async () => {
    await putFile(stableFile)
    const dbRow1 = await fileRepo.findOneOrFail(stableFile.uuid)
    const payload = {uuid: stableFile.uuid, version: '999'}
    await expect(axios.post(`${backendPrivateUrl}files/`, payload)).resolves.toMatchObject({status: 200})
    const dbRow2 = await fileRepo.findOneOrFail(stableFile.uuid)
    expect(dbRow2.version).toEqual('999')
    expect(dbRow2.updatedAt).toEqual(dbRow1.updatedAt)
  })
})
