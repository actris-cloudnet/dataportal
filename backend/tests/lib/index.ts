import * as fs from 'fs'
import * as path from 'path'
import { createConnection } from 'typeorm'

export function clearDir(dir: string) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    fs.unlinkSync(path.join(dir, file))
  }
}

export async function clearRepo(repo: string) {
  const conn = await createConnection('test')
  await conn.getRepository(repo).clear()
  return conn.close()
}

export const inboxDir = 'tests/data/inbox'
export const publicDir = 'tests/data/public'