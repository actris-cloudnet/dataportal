interface Config {
  connectionName: string
  publicDir: string
}

const testConfig = {
  connectionName: 'test',
  publicDir: 'tests/data/public'
}

const devConfig = {
  connectionName: 'default',
  publicDir: 'public'
}

let config: Config

switch (process.env.NODE_ENV) {
case 'production':
  try {
    config = require('config.prod.js')
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
