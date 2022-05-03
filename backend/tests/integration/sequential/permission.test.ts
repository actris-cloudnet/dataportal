import axios from 'axios'
import { readFileSync } from 'fs'
import { backendPrivateUrl } from '../../lib'

const USER_ACCOUNTS_URL = `${backendPrivateUrl}user-accounts`

beforeAll(async () => {
  let respGet = await axios.get(USER_ACCOUNTS_URL)
  // Remove users from the db in the beginning
  for (const user of respGet.data) {
    await axios.delete(USER_ACCOUNTS_URL.concat('/', user.id))
  }
  // Add users
  const rawData = readFileSync('tests/data/userAccountCredentials.json', 'utf8')
  const data = JSON.parse(rawData)
  expect(data).toHaveLength(3)
  let respPost = await axios.post(USER_ACCOUNTS_URL, data)
  expect(respPost.status).toBe(200)
})
describe('userAccount permission tests', () => {
  it('adds canUpload permission for mace-head for all users', async () => {
    let resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      let respPost = await axios.post(
        USER_ACCOUNTS_URL.concat('/', user.id, '/permissions?siteId=mace-head&permission=canUpload')
      )
      expect(respPost.status).toBe(200)
    }
  })
  it('fails to add permissions for multiple sites', async () => {
    let resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      await expect(
        axios.post(
          USER_ACCOUNTS_URL.concat('/', user.id, '/permissions?siteId=mace-head&permission=canUpload&siteId=hyytiala')
        )
      ).rejects.toMatchObject({ response: { status: 400 } })
    }
  })
  it('fails to add unexpected permission', async () => {
    let resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      await expect(
        axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions?siteId=mace-head&permission=canTypoUpload'))
      ).rejects.toMatchObject({ response: { status: 400 } })
    }
  })

  it('adds canProcess permission all sites (ie site is null) for all users', async () => {
    let resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      let respPost = await axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions?permission=canProcess'))
      expect(respPost.status).toBe(200)
    }
  })
})
