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
  let userData: any[]
  let aliceData: any
  beforeAll(async () => {
    await userAccountRepository.delete({})
    userData = JSON.parse(readFileSync('tests/data/userAccountsAndPermissions.json', 'utf8'))
    expect(userData).toHaveLength(8)
    console.log(userData)
  })
  it('posts user accounts and permissions', async () => {
    for (const user of userData) {
      const postResp = await axios.post(USER_ACCOUNTS_URL, user)
      expect(postResp).toMatchObject({
        status: 201,
        data: {username: user.username}
      })
      await expect(axios.get(USER_ACCOUNTS_URL.concat('/', postResp.data.id))).resolves.toMatchObject({
        status:200,
        data: {username: user.username}
      })
    }
  })

  it('changes alices username and then resets it back', async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL)
    const alice = getRespAllUsers.data.find((u: any) => u.username === 'alice')
    expect(alice).not.toBeUndefined()
    expect(alice.username).toBe('alice')
    await expect(axios.put(USER_ACCOUNTS_URL.concat('/', alice.id), { username: 'Ecila' })).resolves.toMatchObject({
      status: 200, data: {id:alice.id}
    })
    await expect(axios.get(USER_ACCOUNTS_URL.concat('/', alice.id))).resolves.toMatchObject({
      data: {username: 'Ecila'}
    })
    await expect(axios.put(USER_ACCOUNTS_URL.concat('/', alice.id), { username: 'alice' })).resolves.toMatchObject({
      status: 200,
      data: {username: 'alice'}
    })
  })
  it('changes alices password', async () => {
    const getRespAllUsers = await axios.get(USER_ACCOUNTS_URL)
    const alice = getRespAllUsers.data.find((u: any) => u.username === 'alice')
    expect(alice).not.toBeUndefined()
    expect(alice.username).toBe('alice')
    await expect(axios.put(USER_ACCOUNTS_URL.concat('/', alice.id), { password: 'alices_new_password' })).resolves.toMatchObject({
      status: 200, data: {id:alice.id}
    })
    const respGetWithNewPassword = await axios.get(USER_ACCOUNTS_URL.concat('/', alice.id))
    expect(respGetWithNewPassword.data.passwordHash).toMatch('$apr1$')
    expect(respGetWithNewPassword.data.passwordHash).not.toEqual(alice.passwordHash)
    expect(respGetWithNewPassword.data.permissions).toEqual(alice.permissions)
  })

})
