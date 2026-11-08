// server/utils/gaClient.js
import { BetaAnalyticsDataClient } from '@google-analytics/data'

let client = null

function readServiceAccount() {
  const b64 = process.env.GA_SERVICE_ACCOUNT_JSON_B64 && process.env.GA_SERVICE_ACCOUNT_JSON_B64.trim()
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON && process.env.GA_SERVICE_ACCOUNT_JSON.trim()
  if (!b64 && !raw) throw new Error('Missing GA env: set GA_SERVICE_ACCOUNT_JSON_B64 or GA_SERVICE_ACCOUNT_JSON')

  const text = b64 ? Buffer.from(b64, 'base64').toString('utf8').trim() : raw
  if (!text || text[0] !== '{') throw new Error('Decoded service account is not JSON')
  const json = JSON.parse(text)
  if (json && typeof json.private_key === 'string') json.private_key = json.private_key.replace(/\\n/g, '\n')
  return json
}

export function getGAClient() {
  if (client) return client
  const creds = readServiceAccount()
  client = new BetaAnalyticsDataClient({
    // Force REST (avoids gRPC DNS resolver issues on some Windows/Node setups)
    fallback: true,
    apiEndpoint: 'analyticsdata.googleapis.com',
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  })
  return client
}
