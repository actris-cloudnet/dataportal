import {ClientConfiguration} from 'aws-sdk/clients/s3'

interface Config {
  connectionName: string
  fileServerUrl: string
  pidServiceUrl: string
  pidServiceTimeoutMs: number
  publicDir: string
  s3: s3Config
}

interface s3Config {
  connection: {
    rw: ClientConfiguration
  },
  buckets: {
    upload: string
  }
}

const testConfig = {
  connectionName: 'test',
  fileServerUrl: 'http://localhost:4001/',
  pidServiceUrl: 'http://localhost:5801/pid/',
  pidServiceTimeoutMs: 200,
  publicDir: 'tests/data/public',
  s3: {
    connection: {rw: {}},
    buckets: {upload: ''}
  }
}

const devConfig = (s3Config: s3Config) => ({
  connectionName: 'default',
  fileServerUrl: 'http://localhost:4000/',
  pidServiceUrl: 'http://localhost:5800/pid/',
  pidServiceTimeoutMs: 2000,
  publicDir: 'public',
  s3: s3Config
})

let config: Config

switch (process.env.NODE_ENV) {
case 'production':
  try {
    config = require('./config.prod').default
  } catch (ex) {
    throw new Error('FATAL: Production configuration not found.')
  }
  break
case 'test':
  config = testConfig
  break
default:
  try {
    const s3Config = require('../../../dataportal-production/altocumulus/backend/private/config.s3').default
    config = devConfig(s3Config)
  } catch (ex) {
    throw new Error('FATAL: S3 configuration not found.')
  }
  break
}

export default config
