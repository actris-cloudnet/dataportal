import 'reflect-metadata'
import {backendPublicUrl, genResponse} from '../../lib'
import axios from 'axios'
import {RequestError} from '../../../src/entity/RequestError'
import {Connection, createConnection} from 'typeorm'
import {readResources} from '../../../../shared/lib'

let conn: Connection
let responses: any

beforeAll(async () => {
  responses = await readResources()
  conn = await createConnection('test')
})

afterAll(() => conn.close())


describe('/api/files', () => {
  const url = `${backendPublicUrl}files/`
  const expectedBody404: RequestError = {
    status: 404,
    errors: 'Not found'
  }

  it('responds with 400 if no query parameters are given', () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'No search parameters given' ]
    }
    expect(axios.get(`${backendPublicUrl}files/`)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 400 if invalid query parameters are given', () => {
    const payload = {params: {site: 'macehead', x: '', y: 'kissa'}}
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'Unknown query parameters: x,y' ]
    }
    expect(axios.get(`${backendPublicUrl}files/`, payload))
      .rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with an array of 3 objects when searching for macehead', async () => {
    const payload = {params: {site: 'macehead'}}
    const res = await axios.get(url, payload)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(3)
    return expect(res.data.map((d: any) => d.site.id)).toEqual(['macehead', 'macehead', 'macehead'])
  })

  it('responds with an array of 4 objects when searching for macehead and hyytiala', async () => {
    const payload = {params: {site: ['macehead', 'hyytiala']}}
    const res = await axios.get(url, payload)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(4)
    return expect(new Set(res.data.map((d: any) => d.site.id))).toEqual(new Set(['macehead', 'macehead', 'macehead', 'hyytiala']))
  })


  it('responds with 404 if site was not found', () => {
    const payload = {params: {site: ['kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified sites were not found']
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('responds 404 if one of many sites was not found', () => {
    const payload = {params: {site: ['macehead', 'kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified sites were not found']
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('responds with an array of objects with dates between [ dateFrom, dateTo ], in descending order', async () => {
    const payload = {params: {dateFrom: new Date('2018-06-09'), dateTo: new Date('2019-09-01')}}
    const res = await axios.get(url, payload)
    return expect(res.data.map((d: any) => d.measurementDate)).toEqual(['2019-09-01', '2019-07-16', '2019-07-16', '2019-07-15', '2018-11-15', '2018-06-09'])
  })

  it('responds with correct objects if product is specified', async () => {
    const payload = {params: {product: 'radar'}}
    const res = await axios.get(url, payload)
    return expect(res.data.map((d: any) => d.product.id)).toEqual(['radar', 'radar'])
  })

  it('responds with correct objects if dateFrom, dateTo, site, and product are specified', async () => {
    const payload = {params: {dateFrom: new Date('2018-06-09'), dateTo: new Date('2019-09-02'), site: 'macehead', product: 'classification'}}
    const res = await axios.get(url, payload)
    expect(res.data.map((d: any) => d.site.id)).toEqual(['macehead'])
    expect(res.data.map((d: any) => d.product.id)).toEqual(['classification'])
    return expect(res.data.map((d: any) => d.measurementDate)).toEqual(['2018-06-09'])
  })

  it('responds with 400 on malformed dateFrom', () => {
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Malformed date in property "dateFrom"' ]
    }
    const payload1 = {params: {dateFrom: 'turku'}}
    return expect(axios.get(url, payload1)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 400 on malformed dateTo', () => {
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Malformed date in property "dateTo"' ]
    }
    const payload = {params: {dateFrom: new Date('2020-02-20'), dateTo: 'turku'}}
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('has exactly three stable files', async () => {
    const payload = {params: {volatile: 'false'}}
    const res = await axios.get(url, payload)
    return expect(res.data).toHaveLength(3)
  })

  it('does not show test files in normal mode', async () => {
    const payload = {params: {site: 'granada'}}
    expectedBody404.errors = ['One or more of the specified sites were not found']
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('shows test files in developer mode', async () => {
    const payload = {params: {site: 'granada', developer: ''}}
    return expect(axios.get(url, payload)).resolves.toBeTruthy()
  })

  it('returns newest file by default', async () => {
    const res = await axios.get(url, { params: { product: 'categorize', dateTo: '2019-07-15' }})
    expect(res.data).toHaveLength(1)
    expect(res.data[0].uuid).toEqual('8bb32746-faf0-4057-9076-ed2e698dcf36')
  })

  it('returns optionally all versions of a file sorted by updatedAt', async () => {
    const res = await axios.get(url, { params: { product: 'categorize', dateTo: '2019-07-15', allVersions: '' }})
    expect(res.data).toHaveLength(3)
    expect(new Date(res.data[0].updatedAt).getTime()).toBeGreaterThan(new Date(res.data[1].updatedAt).getTime())
    expect(new Date(res.data[1].updatedAt).getTime()).toBeGreaterThan(new Date(res.data[2].updatedAt).getTime())
  })

  it('returns the latest file when limit=1', async () => {
    const res = await axios.get(url, { params: { site: 'bucharest', limit: '1' }})
    expect(res.data).toHaveLength(1)
    expect(res.data[0].measurementDate).toEqual('2020-12-05')
  })

  it('responds with 400 on malformed limit', async () => {
    const payload = { params: { site: 'bucharest', limit: 'j' }}
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Malformed value in property "limit"' ]
    }
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('by default does not show legacy data', async () => {
    const payload = { params: { site: 'bucharest', product: 'classification', dateFrom: '2009-01-01', dateTo: '2010-01-01' }}
    return expect(axios.get(url, payload)).resolves.toMatchObject({data: []})
  })
  it('shows legacy data when using showLegacy flag', async () => {
    const payload = { params: { site: 'bucharest', product: 'classification', dateFrom: '2009-01-01', dateTo: '2010-01-01', showLegacy: true }}
    return expect(axios.get(url, payload)).resolves.toMatchObject({data: [{legacy: true}]})
  })

  it('responds with the best model file by default', async () => {
    const payload = {params: {product: 'model', site: 'bucharest', dateFrom: '2020-12-05', dateTo: '2020-12-05'}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(1)
    return expect(res.data[0]).toMatchObject({ model: {id: 'ecmwf'}})
  })

  it('responds with the specified model file', async () => {
    const payload = {params: {product: 'model', site: 'bucharest', dateFrom: '2020-12-05', dateTo: '2020-12-05', model: 'icon-iglo-12-23'}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(1)
    return expect(res.data[0]).toMatchObject({ model: {id: 'icon-iglo-12-23'}})
  })

  it('responds with all model files with allModels flag ordered by model quality', async () => {
    const payload = {params: {product: 'model', site: 'bucharest', dateFrom: '2020-12-05', dateTo: '2020-12-05', allModels: true}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(2)
    expect(res.data[0]).toMatchObject({ model: {id: 'ecmwf'}})
    expect(res.data[1]).toMatchObject({ model: {id: 'icon-iglo-12-23'}})
  })

  it('responds with all versions of best model file when using allVersions', async () => {
    const payload = {params: {product: 'model', site: 'bucharest', dateFrom: '2020-12-05', dateTo: '2020-12-05', allVersions: true}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(2)
    expect(res.data[0]).toMatchObject({ version: '123'})
    expect(res.data[1]).toMatchObject({ version: '122'})
  })

  it('responds with latest version using allModels flag', async () => {
    const payload = {params: {product: 'categorize', site: 'bucharest', date: '2019-07-15', allModels: true}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toMatchObject({ version: '123'})
  })

  it('responds with data for one day when using the date parameter', async () => {
    const payload = {params: {product: 'model', site: 'bucharest', date: '2020-12-05'}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(1)
    return expect(res.data[0]).toMatchObject({ model: {id: 'ecmwf'}})
  })

  it('responds with 400 on malformed date', async () => {
    const payload = { params: { date: 'j' }}
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Malformed date in property "date"' ]
    }
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 400 if model and allModels are both defined', async () => {
    const payload = {params: {product: 'model', model: 'ecmwf', allModels: true}}
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Properties "allModels" and "model" can not be both defined' ]
    }
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 400 if model and allModels are both defined', async () => {
    const payload = {params: {product: 'model', model: 'ecmwf', allModels: true}}
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Properties "allModels" and "model" can not be both defined' ]
    }
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 404 if a specified model is not found', async () => {
    const payload = {params: {product: 'model', model: 'sammakko'}}
    let expectedBody: RequestError = {
      status: 404,
      errors: [ 'One or more of the specified models were not found' ]
    }
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 400 on conflicting date, dateFrom and dateTo', async () => {
    const validParams = {date: '2020-12-05'}
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Property "date" may not be defined if either "dateFrom" or "dateTo" is defined' ]
    }
    let params: any = {...validParams, ...{dateFrom: '2020-11-05'}}
    await expect(axios.get(url, {params})).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
    params = {...validParams, ...{dateTo: '2020-12-08'}}
    await expect(axios.get(url, {params})).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
    params = {...validParams, ...{dateFrom: '2020-11-05', dateTo: '2020-12-08'}}
    return expect(axios.get(url, {params})).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

})

describe('/api/search', () => {
  const url = `${backendPublicUrl}search/`

  it('responds with correct objects if dateFrom, dateTo, site, and product are specified', async () => {
    const expectedData = [responses['allsearch'][2]]
    const payload = {params: {dateFrom: new Date('2018-06-09'), dateTo: new Date('2019-09-02'), site: 'macehead', product: 'classification'}}
    const res = await axios.get(url, payload)
    return expect(res.data).toMatchObject(expectedData)
  })
})
