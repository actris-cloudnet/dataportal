import {backendPublicUrl, genResponse} from '../../lib'
import axios from 'axios'
import {readResources} from '../../../../shared/lib'

const url = `${backendPublicUrl}sites/`
let resources: any

beforeAll(async () => (resources = await readResources()))

describe('GET /api/sites', () => {

  it('responds with a list of all sites in dev mode', async () => {
    const sites = ['macehead', 'hyytiala', 'bucharest', 'granada']
    const res = await axios.get(url, { params: { developer: '' }})
    expect(res.data).toHaveLength(sites.length)
    const siteList = res.data.map((d: any) => d.id)
    return sites.forEach(site => expect(siteList).toContain(site))
  })

  it('responds with a list of all sites except test in normal mode', async () => {
    const sites = ['macehead', 'hyytiala', 'bucharest']
    const res = await axios.get(url)
    expect(res.data).toHaveLength(sites.length)
    const siteList = res.data.map((d: any) => d.id)
    return sites.forEach(site => expect(siteList).toContain(site))
  })
})

describe('GET /api/sites?modelSites', () => {

  const modelSiteUrl = `${backendPublicUrl}sites/?modelSites`

  it('responds with a list of all sites', async () => {
    const sites = ['macehead', 'hyytiala', 'bucharest', 'granada', 'potenza', 'norunda']
    const res = await axios.get(modelSiteUrl)
    expect(res.data).toHaveLength(sites.length)
    const siteList = res.data.map((d: any) => d.id)
    return sites.forEach(site => expect(siteList).toContain(site))
  })

})


describe('GET /api/sites/:siteid', () => {

  it('responds with the correct json on valid id', async () => {
    const validUrl = `${url}bucharest`
    const res = await axios.get(validUrl)
    expect(res.data).toMatchObject(resources['sites'][0])
  })

  it('responds with 404 if site is not found', async () => {
    const invalidUrl = `${url}espoo`
    return expect(axios.get(invalidUrl)).rejects.toMatchObject(genResponse(404, {status: 404, errors: ['No sites match this id']}))
  })

})
