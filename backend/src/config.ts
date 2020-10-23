interface Config {
  connectionName: string
  fileServerUrl: string
  pidServiceUrl: string
  pidServiceTimeoutMs: number
  publicDir: string
}

const testConfig = {
  connectionName: 'test',
  fileServerUrl: 'http://localhost:4001/',
  pidServiceUrl: 'http://localhost:5801/pid/',
  pidServiceTimeoutMs: 200,
  publicDir: 'tests/data/public'
}

const devConfig = {
  connectionName: 'default',
  fileServerUrl: 'http://localhost:4000/',
  pidServiceUrl: 'http://localhost:5800/pid/',
  pidServiceTimeoutMs: 2000,
  publicDir: 'public'
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
