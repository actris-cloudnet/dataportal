import {ClientConfiguration} from 'aws-sdk/clients/s3'

interface Config {
  port: number
  connectionName: string
  downloadBaseUrl: string
  pidServiceUrl: string
  pidServiceTimeoutMs: number
  publicDir: string
  s3: s3Config,
  allowUpdateLimitDays: number
  storageService: {
    host: string
    port: string
    user: string
    password: string
  }
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
  port: 3001,
  connectionName: 'test',
  downloadBaseUrl: 'http://localhost:3001/api/download/',
  pidServiceUrl: 'http://localhost:5801/pid/',
  pidServiceTimeoutMs: 200,
  publicDir: 'tests/data/public',
  s3: {
    connection: {rw: {}},
    buckets: {upload: 'cloudnet-upload-test'}
  },
  allowUpdateLimitDays: 2,
  storageService: {
    host: 'localhost',
    port: '5910',
    user: 'test',
    password: 'test'
  }
}

const devConfig = {
  port: 3000,
  connectionName: 'default',
  downloadBaseUrl: 'http://localhost:3000/api/download/',
  pidServiceUrl: 'http://localhost:5800/pid/',
  pidServiceTimeoutMs: 2000,
  publicDir: 'public',
  s3: {
    connection: {rw: {}},
    buckets: {upload: 'cloudnet-upload-dev'}
  },
  allowUpdateLimitDays: 2,
  storageService: {
    host: 'localhost',
    port: '5900',
    user: 'test',
    password: 'test'
  }
}

const ciConfig = {
  ...testConfig,
  ...{ connectionName: 'ci-test' }
}

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
  config = (process.env.CI) ? ciConfig : testConfig
  break
default:
  config = devConfig
  break
}

export default config
