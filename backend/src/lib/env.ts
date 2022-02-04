import {URL} from 'url'

const envVars = ['NODE_ENV', 'DP_PID_SERVICE_URL', 'DP_SS_URL',
  'DP_PID_SERVICE_TIMEOUT_MS', 'DP_SS_USER', 'DP_SS_PASSWORD',
  'DP_PID_SERVICE_TIMEOUT_MS', 'DP_BACKEND_URL', 'GEOLITE2_COUNTRY_PATH']

const missingVars = envVars.filter(env => !process.env[env])
if (missingVars.length > 0) throw new Error(`FATAL: Following environment variables must be set: ${missingVars.join(', ')}`)

let envs = process.env as any
let ssUrl = new URL(envs.DP_SS_URL)
envs['DP_SS_HOST'] = ssUrl.hostname
envs['DP_SS_PORT'] = parseInt(ssUrl.port)
envs['DP_PID_SERVICE_TIMEOUT_MS'] = parseInt(envs.DP_PID_SERVICE_TIMEOUT_MS)

interface Env {
  NODE_ENV: string
  DP_PID_SERVICE_URL: string
  DP_SS_URL: string
  DP_SS_HOST: string
  DP_SS_PORT: number
  DP_SS_USER: string
  DP_SS_PASSWORD: string
  DP_PID_SERVICE_TIMEOUT_MS: number
  DP_BACKEND_URL: string
  GEOLITE2_COUNTRY_PATH: string
}

export default envs as Env
