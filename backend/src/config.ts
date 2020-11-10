import {ClientConfiguration} from 'aws-sdk/clients/s3'

interface Config {
  connectionName: string
  fileServerUrl: string
  pidServiceUrl: string
  pidServiceTimeoutMs: number
  publicDir: string
  s3: s3Config,
  allowUpdateLimitDays: number
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
    buckets: {upload: 'cloudnet-upload-test'}
  },
  allowUpdateLimitDays: 2
}

const devConfig = {
  connectionName: 'default',
  fileServerUrl: 'http://localhost:4000/',
  pidServiceUrl: 'http://localhost:5800/pid/',
  pidServiceTimeoutMs: 2000,
  publicDir: 'public',
  s3: {
    connection: {rw: {}},
    buckets: {upload: 'cloudnet-upload-dev'}
  },
  allowUpdateLimitDays: 2
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
  config = testConfig
  break
default:
  config = devConfig
  break
}

export default config
