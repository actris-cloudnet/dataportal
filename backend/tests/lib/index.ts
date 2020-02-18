import * as fs from 'fs'
import * as path from 'path'
import { createConnection } from 'typeorm'

export function clearDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    fs.unlinkSync(path.join(dir, file));
  }
}


export async function clearDb() {
  const conn = await createConnection('test')
  await conn.synchronize(true) // Clean db
  return conn.close()
}

export const inboxDir = 'tests/data/inbox'
export const publicDir = 'tests/data/public'