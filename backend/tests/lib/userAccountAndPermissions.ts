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
  expect(data).toHaveLength(8)
  const respPost = await axios.post(USER_ACCOUNTS_URL, data)
  expect(respPost.status).toBe(200)
  // Give permissions
  const respUsers = await axios.get(USER_ACCOUNTS_URL)
  for (const user of respUsers.data) {
    let permissions: any[] = []
    if (user.username === 'alice') {
      permissions = [ { permission: 'canUpload' }] // Alice can upload to all sites
    } else if (user.username === 'bob') {
      permissions = [{ permission: 'canUploadModel' }] // Bob can upload models to all sites
    } else if (user.username === 'carol') {
      permissions = [{permission: 'canUpload', siteId: 'bucharest'},{permission: 'canUpload', siteId: 'mace-head'} ]
    } else if (user.username === 'david') {
      permissions = [{permission: 'canUploadModel', siteId: 'granada'},{permission: 'canUpload', siteId: 'mace-head'} ]
    } else if (user.username === 'bucharest') {
      permissions = [{ permission: 'canUpload', siteId: 'bucharest' }]
    } else if (user.username === 'granada') {
      permissions = [{ permission: 'canUpload', siteId: 'granada' }]
    } else if (user.username === 'mace-head') {
      permissions = [{ permission: 'canUpload', siteId: 'mace-head' }]
    }
    if (permissions.length > 0) {
      for (const permission of permissions){
        const respPermission = await axios.post(USER_ACCOUNTS_URL.concat('/', user.id, '/permissions'), permission)
        expect(respPermission.status).toBe(200)
      }
    } else {
      expect(user.username).toBe('eve')
    }
  }
}
