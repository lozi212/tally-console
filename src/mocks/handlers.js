import { http, HttpResponse, delay } from 'msw'
import { createSeed, PASSWORD, USERS } from './data'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

export const config = {
  // Set VITE_API_FAILURES=off to disable random 500s (recommended for tests).
  failures: env.VITE_API_FAILURES !== 'off',
  failureRate: 0.05,
  // Set VITE_API_LATENCY=0 to remove latency (recommended for tests).
  latency: env.VITE_API_LATENCY === undefined ? [300, 800] : [Number(env.VITE_API_LATENCY), Number(env.VITE_API_LATENCY)],
}

// ---------------------------------------------------------------------------
// In-memory store (resets on page reload / per test run)
// ---------------------------------------------------------------------------

export let db = { transactions: createSeed(), sessions: new Map() }

export function resetDb() {
  db = { transactions: createSeed(), sessions: new Map() }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function simulateNetwork() {
  const [min, max] = config.latency
  if (max > 0) await delay(min + Math.random() * (max - min))
  if (config.failures && Math.random() < config.failureRate) {
    return HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
  return null
}

function authenticate(request) {
  const header = request.headers.get('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token || !db.sessions.has(token)) return null
  return db.sessions.get(token)
}

function unauthorized() {
  return HttpResponse.json({ message: 'Not authenticated' }, { status: 401 })
}

function money(n) {
  return Math.round(n * 100) / 100
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const handlers = [
  http.post('*/api/login', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const body = await request.json().catch(() => ({}))
    const { username, password } = body

    if (!username || !password) {
      return HttpResponse.json({ message: 'Username and password are required' }, { status: 400 })
    }
    if (password !== PASSWORD) {
      return HttpResponse.json({ message: 'Invalid username or password' }, { status: 401 })
    }

    const token = `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    const user = { id: `usr_${username}`, name: USERS.defaultName(username) }
    db.sessions.set(token, user)

    return HttpResponse.json({ token, user })
  }),

  http.get('*/api/me', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const user = authenticate(request)
    if (!user) return unauthorized()
    return HttpResponse.json(user)
  }),

  http.get('*/api/transactions', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    if (!authenticate(request)) return unauthorized()
    // Deliberately returns everything: no paging, filtering or sorting on the server.
    return HttpResponse.json(db.transactions.map(({ items, ...rest }) => rest))
  }),

  http.get('*/api/transactions/:id', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    if (!authenticate(request)) return unauthorized()
    const txn = db.transactions.find((t) => t.id === params.id)
    if (!txn) return HttpResponse.json({ message: 'Transaction not found' }, { status: 404 })
    return HttpResponse.json(txn)
  }),

  http.post('*/api/transactions/:id/refund', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    if (!authenticate(request)) return unauthorized()
    const txn = db.transactions.find((t) => t.id === params.id)
    if (!txn) return HttpResponse.json({ message: 'Transaction not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const amount = Number(body.amount)
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (txn.status === 'pending' || txn.status === 'failed') {
      return HttpResponse.json({ message: `Cannot refund a ${txn.status} transaction` }, { status: 400 })
    }
    if (txn.status === 'refunded') {
      return HttpResponse.json({ message: 'Transaction is already fully refunded' }, { status: 400 })
    }
    if (!reason) {
      return HttpResponse.json({ message: 'A reason is required' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return HttpResponse.json({ message: 'Amount must be greater than zero' }, { status: 400 })
    }
    const refundable = money(txn.amount - txn.refundedAmount)
    if (amount > refundable) {
      return HttpResponse.json(
        { message: `Amount exceeds refundable balance of ${refundable.toFixed(2)} ${txn.currency}` },
        { status: 400 },
      )
    }

    txn.refundedAmount = money(txn.refundedAmount + amount)
    txn.status = txn.refundedAmount >= txn.amount ? 'refunded' : 'partially_refunded'

    return HttpResponse.json(txn)
  }),
]
