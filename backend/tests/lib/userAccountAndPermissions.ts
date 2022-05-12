import axios from 'axios'
import { readFileSync } from 'fs'
import { backendPrivateUrl } from '../lib'

export async function initUsersAndPermissions() {
  // Init userAccounts and permissions
  const USER_ACCOUNTS_URL = `${backendPrivateUrl}user-accounts`
  const PERMISSIONS_URL = `${backendPrivateUrl}permissions`

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
  expect(data).toHaveLength(6)
  const respPost = await axios.post(USER_ACCOUNTS_URL, data)
  expect(respPost.status).toBe(200)
  // Give permissions
  const respUsers = await axios.get(USER_ACCOUNTS_URL)
  for (const user of respUsers.data) {
    let permission = undefined
    if (user.username === 'alice') {
      permission = { permission: 'canUpload' } // Alice can upload to all sites
    } else if (user.username === 'bob') {
      permission = { permission: 'canUploadModel' } // Bob can upload models to all sites
    } else if (user.username === 'bucharest') {
      permission = { permission: 'canUpload', siteId: 'bucharest' }
    } else if (user.username === 'granada') {
      permission = { permission: 'canUpload', siteId: 'granada' }
    } else if (user.username === 'mace-head') {
      permission = { permission: 'canUpload', siteId: 'mace-head' }
    }
    if (permission !== undefined) {
      const respPermission = await axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions'), permission)
      expect(respPermission.status).toBe(200)
    } else {
      expect(user.username).toBe('eve')
    }
  }
}
