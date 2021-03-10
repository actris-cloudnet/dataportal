import * as fs from 'fs'
import * as path from 'path'
import {resolve} from 'path'
import {URL} from 'url'
import {createConnection} from 'typeorm'
import axios from 'axios'

if (!process.env.DP_BACKEND_URL) throw new Error('DP_BACKEND_URL must be set')
if (!process.env.DP_FRONTEND_URL) throw new Error('DP_FRONTEND_URL must be set')
if (!process.env.DP_SS_TEST_URL) throw new Error('DP_SS_TEST_URL must be set')

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
  const conn = await createConnection()
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

const backendUrl = process.env.DP_BACKEND_URL
export const publicDir = 'tests/data/public'
export const backendProtectedUrl = `${backendUrl}/protected/`
export const backendPublicUrl = `${backendUrl}/api/`
export const backendPrivateUrl = `${backendUrl}/`
export const frontendUrl = `${process.env.DP_FRONTEND_URL}/`
export const storageServiceUrl = `${process.env.DP_SS_TEST_URL}/`
export const visualizationPayloads = [  {
  s3key: resolve('tests/data/20200501_bucharest_classification_detection_status.png'),
  sourceFileId: '7a9c3894ef7e43d9aa7da3f25017acec',
  variableId: 'classification-detection_status'
},  {
  s3key: resolve('tests/data/20200501_bucharest_classification_target_classification.png'),
  sourceFileId: '7a9c3894ef7e43d9aa7da3f25017acec',
  variableId: 'classification-target_classification'
} ]
