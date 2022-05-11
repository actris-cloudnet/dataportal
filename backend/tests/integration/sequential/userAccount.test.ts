import axios from 'axios'
import { readFileSync } from 'fs'
import { backendPrivateUrl } from '../../lib'

const USER_ACCOUNTS_URL = `${backendPrivateUrl}user-accounts`

beforeAll(async () => {
  let req = await axios.get(USER_ACCOUNTS_URL)
  // Remove users from the db in the beginning
  for (const user of req.data) {
    await axios.delete(USER_ACCOUNTS_URL.concat('/', user.id))
  }
})

describe('userAccount tests', () => {
  it('responds with zero user at the beginning', async () => {
    let req = await axios.get(USER_ACCOUNTS_URL)
    expect(req.data).toHaveLength(0)
  })
  it('adds six users succesfully', async () => {
    const rawData = readFileSync('tests/data/userAccountCredentials.json', 'utf8')
    const data = JSON.parse(rawData)
    expect(data).toHaveLength(6)
    let resp = await axios.post(USER_ACCOUNTS_URL, data)
    expect(resp.status).toBe(200)
  })
  it('responds with six users', async () => {
    let req = await axios.get(USER_ACCOUNTS_URL)
    expect(req.data).toHaveLength(6)
  })
  it('deletes all users one at the time', async () => {
    let req = await axios.get(USER_ACCOUNTS_URL)
    let nUsers = req.data.length
    expect(nUsers).toBe(6)
    for (const user of req.data) {
      await axios.delete(USER_ACCOUNTS_URL.concat('/', user.id))
      let reqGet = await axios.get(USER_ACCOUNTS_URL)
      expect(reqGet.data).toHaveLength(--nUsers)
    }
    let reqFinal = await axios.get(USER_ACCOUNTS_URL)
    expect(reqFinal.data).toHaveLength(0)
  })
})
