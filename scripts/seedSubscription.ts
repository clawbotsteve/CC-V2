// user-call-seed.ts (Node.js script)

import { absoluteUrl } from '../lib/utils'
import fetch from 'node-fetch'

async function callSeedAPI() {
  const res = await fetch(absoluteUrl('/api/billing/pz/subscriptions/create'), {
    method: 'POST',
  })

  if (!res.ok) {
    console.log({
      res
    })
    console.error('Failed to call seed API:', res.statusText)
    return
  }

  const data = await res.json()
  console.log('Seed API response:', data)
}

callSeedAPI().catch(console.error)
