import * as fs from 'fs'
import * as path from 'path'
import {resolve} from 'path'
import {createConnection} from 'typeorm'
import axios from 'axios'

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

export async function putFile(filename: string) {
  await Promise.all([
    axios.put(`${storageServiceUrl}cloudnet-product-volatile/${filename}`, 'content'),
    axios.put(`${storageServiceUrl}cloudnet-product/${filename}`, 'content')
  ])
  const json = JSON.parse(fs.readFileSync(`tests/data/${filename}.json`, 'utf8'))
  const url = `${backendPrivateUrl}files/${filename}`
  return axios.put(url, json)
}

export const wait = async (ms: number) => new Promise((resolve, _) => setTimeout(resolve, ms))

export const genResponse = (status: any, data: any) => ({response: {status, data}})

export const publicDir = 'tests/data/public'
export const backendProtectedUrl = 'http://localhost:3001/protected/'
export const backendPublicUrl = 'http://localhost:3001/api/'
export const backendPrivateUrl = 'http://localhost:3001/'
export const fileServerUrl = 'http://localhost:4001/'
export const storageServiceUrl = 'http://localhost:5920/'
export const visualizationPayloads = [  {
  s3key: resolve('tests/data/20200501_bucharest_classification_detection_status.png'),
  sourceFileId: '7a9c3894ef7e43d9aa7da3f25017acec',
  variableId: 'classification-detection_status'
},  {
  s3key: resolve('tests/data/20200501_bucharest_classification_target_classification.png'),
  sourceFileId: '7a9c3894ef7e43d9aa7da3f25017acec',
  variableId: 'classification-target_classification'
} ]
