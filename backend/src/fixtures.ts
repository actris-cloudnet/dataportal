import {Connection, createConnection} from 'typeorm'
import { promises as fsp } from 'fs'
import { basename, join } from 'path'
import { argv } from 'process'

const isJson = (filepath: string) => filepath.substring(filepath.length - 4) == 'json'

async function handleFile(conn: Connection, filepath: string) {
  const repoName = basename(filepath).split('-')[1].split('.')[0]
  return conn.getRepository(repoName).save(JSON.parse((await fsp.readFile(filepath)).toString()))
}

async function handleDir(conn: Connection, dirpath: string) {
  const fixtureFiles = (await fsp.readdir(dirpath))
    .filter(isJson)
    .sort()
    .map(filename => join(dirpath, filename))

  console.log('Reading fixtures from', fixtureFiles.length, 'files')
  for (const filepath of fixtureFiles) {
    await handleFile(conn, filepath)
  }
}

async function importFixture(connName: string, path: string) {
  const conn = await createConnection(connName)
  const stat = await fsp.lstat(path)
  if (stat.isDirectory()) return handleDir(conn, path)
  else if (stat.isFile() && isJson(path)) return handleFile(conn, path)
  else throw ('Unknown file type')
}

importFixture(argv[2], argv[3])
  .then(() => {
    console.log('Success!')
    process.exit(0)
  })
  .catch(err => {
    console.error('FATAL:', err)
    process.exit(1)
  })
