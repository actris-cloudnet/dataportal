import 'reflect-metadata'
import { backendPublicUrl, genResponse } from '../../lib'
import axios from 'axios'
import { RequestError } from '../../../src/entity/RequestError'


describe('GET /api/model-files', () => {
  const url = `${backendPublicUrl}model-files/`
  const expectedBody404: RequestError = {
    status: 404,
    errors: 'Not found'
  }

  it('responds with 400 if no query parameters are given', () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'No search parameters given' ]
    }
    return expect(axios.get(url)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with 400 if invalid query parameters are given', () => {
    const payload = {params: {location: 'macehead', x: '', y: 'kissa'}}
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'Unknown query parameters: x,y' ]
    }
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('responds with an array of 3 objects when searching for granada', async () => {
    const payload = {params: {location: 'granada'}}
    const res = await axios.get(url, payload)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(3)
    return expect(res.data.map((d: any) => d.site.id)).toEqual(['granada', 'granada', 'granada'])
  })

  it('responds with an array of 2 objects when searching for macehead and bucharest', async () => {
    const payload = {params: {location: ['macehead', 'bucharest']}}
    const res = await axios.get(url, payload)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(2)
    return expect(new Set(res.data.map((d: any) => d.site.id))).toEqual(new Set(['macehead', 'bucharest']))
  })

  it('responds with 404 if location was not found', () => {
    const payload = {params: {location: ['kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified locations were not found']
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('responds 404 if one of many locations was not found', () => {
    const payload = {params: {location: ['macehead', 'kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified locations were not found']
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('responds with 400 on malformed date', () => {
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Malformed date in property "date"' ]
    }
    const payload1 = {params: {date: 'turku'}}
    return expect(axios.get(url, payload1)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('has exactly 2 stable files', async () => {
    const payload = {params: {volatile: false}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(2)
    return expect(new Set(res.data.map((d: any) => d.volatile))).toEqual(new Set([false, false]))
  })

  it('has exactly 3 volatile files', async () => {
    const payload = {params: {volatile: true}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(3)
    return expect(new Set(res.data.map((d: any) => d.volatile))).toEqual(new Set([true, true, true]))
  })

  it('responds with correct objects with certain modelType', async () => {
    const model = 'icon-iglo-12-23'
    const payload = {params: {modelType: model}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(2)
    return expect(new Set(res.data.map((d: any) => d.modelType.id))).toEqual(new Set([model, model]))
  })

  it('responds with correct objects with certain date', async () => {
    const payload = {params: {date: '2010-01-02'}}
    const res = await axios.get(url, payload)
    expect(res.data).toHaveLength(1)
    return expect(res.data[0].measurementDate).toBe('2010-01-02')
  })

})

describe('GET /api/model-types', () => {

  const modelTypeUrl = `${backendPublicUrl}model-types/`

  it('responds with a list of all model types', async () => {
    const types = ['ecmwf', 'icon-iglo-12-23', 'icon-iglo-24-35', 'icon-iglo-36-47', 'gdas1']
    const res = await axios.get(modelTypeUrl)
    expect(res.data).toHaveLength(types.length)
    const siteList = res.data.map((d: any) => d.id)
    return types.forEach(mtype => expect(siteList).toContain(mtype))
  })

})

