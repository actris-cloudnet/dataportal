import axios from 'axios'
import { readFileSync } from 'fs'
import { backendPrivateUrl } from '../../lib'

const USER_ACCOUNTS_URL = `${backendPrivateUrl}user-accounts`
const PERMISSIONS_URL = `${backendPrivateUrl}permissions`

beforeAll(async () => {
  const respGet = await axios.get(USER_ACCOUNTS_URL)
  // Remove users from the db in the beginning
  for (const user of respGet.data) {
    await axios.delete(USER_ACCOUNTS_URL.concat('/', user.id))
  }
  // remove all unused permissions, that is, all permissions since there is no users
  const respDelete = await axios.delete(PERMISSIONS_URL)
  expect(respDelete.status).toBe(200)
  const respGetAfterDelete = await axios.get(PERMISSIONS_URL)
  expect(respGetAfterDelete.data).toHaveLength(0)

  // Add users
  const rawData = readFileSync('tests/data/userAccountCredentials.json', 'utf8')
  const data = JSON.parse(rawData)
  expect(data).toHaveLength(8)
  const respPost = await axios.post(USER_ACCOUNTS_URL, data)
  expect(respPost.status).toBe(200)
})
describe('userAccount permission tests', () => {
  it('adds canUpload permission for mace-head for all users', async () => {
    const resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      const respPost = await axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions'), {
        siteId: 'mace-head',
        permission: 'canUpload',
      })
      expect(respPost.status).toBe(200)
    }
  })
  it('fails to add permissions for multiple sites', async () => {
    const resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      await expect(
        axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions'), {
          siteId: ['mace-head', 'hyytiala'],
          permission: 'canUpload',
        })
      ).rejects.toMatchObject({ response: { status: 400 } })
    }
  })
  it('fails to add unexpected permission', async () => {
    const resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      await expect(
        axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions'), {
          siteId: 'mace-head',
          permission: 'canTypoUpload',
        })
      ).rejects.toMatchObject({ response: { status: 400 } })
    }
  })

  it('adds canProcess permission all sites (ie site is null) for all users', async () => {
    const resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      const respPost = await axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions'), {
        permission: 'canProcess',
      })
      expect(respPost.status).toBe(200)
    }
  })
  it('removes all permissions from Eve', async () => {
    const resp = await axios.get(USER_ACCOUNTS_URL)
    const eve = resp.data.find((user: any) => user.username === 'eve')
    const respEve = await axios.get(USER_ACCOUNTS_URL.concat('/', eve.id, '/permissions'))
    expect(respEve.data.permissions).toHaveLength(2)
    const respDel = await axios.delete(USER_ACCOUNTS_URL.concat('/', eve.id, '/permissions'))
    expect(respDel.status).toBe(200)
    const respEveDeleted = await axios.get(USER_ACCOUNTS_URL.concat('/', eve.id, '/permissions'))
    expect(respEveDeleted.data.permissions).toHaveLength(0)
  })
  it('checks that alice and bob have their permissions', async () => {
    const resp = await axios.get(USER_ACCOUNTS_URL)
    const alice = resp.data.find((user: any) => user.username === 'alice')
    const bob = resp.data.find((user: any) => user.username === 'bob')
    const respAlice = await axios.get(USER_ACCOUNTS_URL.concat('/', alice.id, '/permissions'))
    const respBob = await axios.get(USER_ACCOUNTS_URL.concat('/', bob.id, '/permissions'))
    expect(respAlice.data.permissions).toHaveLength(2)
    expect(respBob.data.permissions).toHaveLength(2)
  })
  it('removes permissions from all users', async () => {
    const resp = await axios.get(USER_ACCOUNTS_URL)
    for (const user of resp.data) {
      const respPost = await axios.delete(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions'))
      expect(respPost.status).toBe(200)
    }
  })
  it('checks that two (unsued) permissions still exist in the db (canUpload:mace-head and canProcess:null)', async () => {
    const respGet = await axios.get(PERMISSIONS_URL)
    expect(respGet.data).toHaveLength(2)
  })
  it('removes the unused permissions', async () => {
    const respDelete = await axios.delete(PERMISSIONS_URL)
    expect(respDelete.status).toBe(200)
    const respGet = await axios.get(PERMISSIONS_URL)
    expect(respGet.data).toHaveLength(0)
  })
})
