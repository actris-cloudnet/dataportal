import axios from 'axios'
import { readFileSync } from 'fs'
import { backendPrivateUrl } from '../../lib'
import { Connection, createConnection } from 'typeorm/'

const USER_ACCOUNTS_URL = backendPrivateUrl.concat('refactored/user-accounts')

let conn: Connection
let userAccountRepository: any

beforeAll(async () => {
  conn = await createConnection()
  userAccountRepository = conn.getRepository('user_account')
})

afterAll(async () => {
  conn.close()
})

describe('test user accounts and permissions', () => {
  beforeAll(async () => {
    await userAccountRepository.delete({})
  })
  let userData: any[]
  it('reads user accounts and permissions from json file', async () => {
    userData = JSON.parse(readFileSync('tests/data/userAccountsAndPermissions.json', 'utf8'))
    expect(userData).toHaveLength(8)
  })
  it('posts user accounts and permissions', async () => {
    for (const user of userData) {
      const postResp = await axios.post(USER_ACCOUNTS_URL, user)
      expect(postResp.status).toBe(201)
      expect(postResp.data.username).toBe(user.username)
      const getResp = await axios.get(USER_ACCOUNTS_URL.concat('/',postResp.data.id))
      expect(getResp.status).toBe(200)
      expect(getResp.data.username).toBe(user.username)
    }
  })
})
