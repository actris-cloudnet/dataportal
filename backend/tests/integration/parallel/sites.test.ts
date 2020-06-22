import { backendPublicUrl } from '../../lib'
import axios from 'axios'

describe('/api/sites', () => {
  const url = `${backendPublicUrl}sites/`

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
