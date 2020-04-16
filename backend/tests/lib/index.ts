import * as fs from 'fs'
import * as path from 'path'
import { createConnection } from 'typeorm'
import * as firefox from 'selenium-webdriver/firefox'
import { Builder } from 'selenium-webdriver'

export function clearDir(dir: string) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const full_path = path.join(dir, file)
    if (!fs.lstatSync(full_path).isDirectory()) {
      fs.unlinkSync(full_path)
    }
  }
}

export async function clearRepo(repo: string) {
  const conn = await createConnection('test')
  await conn.getRepository(repo).clear()
  return conn.close()
}

export const prepareSelenium = async () => {
  const options = new firefox.Options()
  if (process.env.CI) options.addArguments('-headless') // Run in headless on CI
  clearDir(inboxDir)
  clearDir(publicDir)
  clearRepo('file')
  return await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build()
}

export const wait = async (ms: number) => new Promise((resolve, _) => setTimeout(resolve, ms))

export const inboxDir = 'tests/data/inbox'
export const inboxSubDir = 'tests/data/inbox/inbox'
export const publicDir = 'tests/data/public'
export const backendUrl = 'http://localhost:3001/'
export const fileServerUrl = 'http://localhost:4001/'
