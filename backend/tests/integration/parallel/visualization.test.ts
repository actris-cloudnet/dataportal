import axios from 'axios'
import {backendPublicUrl, genResponse} from '../../lib'

const url = `${backendPublicUrl}visualizations/`
const headers = { 'content-type': 'application/json'}

const expectedResult = {
  sourceFileId: '38092c00-161d-4ca2-a29d-628cf8e960f6',
  locationHumanReadable: 'Mace Head',
  productHumanReadable: 'Radar',
  visualizations: [
    {
      filename: 'test1.png',
      'productVariable': {'id': 'test2', 'humanReadableName': 'Kaljanhimo', 'order': '0'}
    },
    {
      filename: 'test0.png',
      'productVariable': {'id': 'test1', 'humanReadableName': 'Auringonpaisteen määrä', 'order': '1'}
    },
  ]
}


describe('GET /visualizations', () => {

  it('on no results returns empty list and responds with 200', async () => {
    const res = await axios.get(url, {headers, params: {product: 'lidar'}})
    expect(res.status).toEqual(200)
    return expect(res.data).toEqual([])
  })

  it('on valid search returns correct list of visualizations and responds with 200', async () => {

    const res = await axios.get(url, {headers, params: {product: 'radar'}})
    expect(res.status).toEqual(200)
    return expect(res.data).toMatchObject([expectedResult])
  })
})

describe('GET /visualizations/:uuid', () => {


  it('responds 404 if invalid uuid', async () => {
    return expect(axios.get(`${url}kisseliini`)).rejects
      .toMatchObject(genResponse(404, {errors: ['Not found: invalid UUID']}))
  })

  it('returns correct list of visualizations and responds with 200', async () => {
    const res = await axios.get(`${url}${expectedResult.sourceFileId}`)
    expect(res.status).toEqual(200)
    return expect(res.data).toMatchObject(expectedResult)
  })
})
