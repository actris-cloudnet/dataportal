import * as fs from 'fs'
import * as path from 'path'
import { createConnection } from 'typeorm'
import { spawn } from 'child_process'
import { Parser } from 'xml2js'

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
  await conn.getRepository(repo).delete({})
  return conn.close()
}

export async function runNcdump(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ncdump', ['-xh', path])
    let out: string = ''
    proc.stderr.on('data', console.error)
    proc.stdout.on('data', data => {
      out += data.toString()
    })
    proc.on('exit', (code, _) => code ? reject(code) : resolve(out))
    proc.on('error', err => reject(err))
  })
}

export async function parseUuid(xml: any) {
  const parser = new Parser()
  return new Promise((resolve) => {
    parser.parseString(xml, (err:any, result:any) => {
      for (let n=0; n < result.netcdf.attribute.length; n++) {
        let {name, value} = result.netcdf.attribute[n].$
        if (name == 'file_uuid') resolve(value)
      }
    })
  })
}

export const wait = async (ms: number) => new Promise((resolve, _) => setTimeout(resolve, ms))

export const genResponse = (status: any, data: any) => ({response: {status, data}})

export const inboxDir = 'tests/data/inbox'
export const inboxSubDir = 'tests/data/inbox/inbox'
export const publicDir = 'tests/data/public'
export const backendPublicUrl = 'http://localhost:3001/api/'
export const backendPrivateUrl = 'http://localhost:3001/'
export const publicVizDir = 'tests/data/public/viz'
export const fileServerUrl = 'http://localhost:4001/'
