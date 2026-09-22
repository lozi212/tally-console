import { faker } from '@faker-js/faker'

const SEED = 20260921

export const STATUSES = ['succeeded', 'pending', 'failed', 'partially_refunded', 'refunded']
export const METHODS = ['card', 'wallet', 'bank_transfer']

const ROW_COUNT = 5000
const NOW = new Date('2026-09-21T12:00:00Z')

function money(n) {
  return Math.round(n * 100) / 100
}

function makeItems() {
  const count = faker.number.int({ min: 1, max: 4 })
  return Array.from({ length: count }, () => {
    const unitPrice = money(faker.number.float({ min: 50, max: 4000, fractionDigits: 2 }))
    return {
      description: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 5 }),
      unitPrice,
    }
  })
}

function makeTransaction(index) {
  const items = makeItems()
  const amount = money(items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0))
  const status = faker.helpers.weightedArrayElement([
    { value: 'succeeded', weight: 70 },
    { value: 'pending', weight: 8 },
    { value: 'failed', weight: 10 },
    { value: 'partially_refunded', weight: 7 },
    { value: 'refunded', weight: 5 },
  ])

  let refundedAmount = 0
  if (status === 'refunded') refundedAmount = amount
  if (status === 'partially_refunded') {
    refundedAmount = money(faker.number.float({ min: 1, max: amount - 1, fractionDigits: 2 }))
  }

  return {
    id: `txn_${faker.string.alphanumeric({ length: 16, casing: 'upper' })}`,
    reference: `INV-${String(20000 + index).padStart(5, '0')}`,
    customer: {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
    },
    amount,
    refundedAmount,
    currency: 'ETB',
    status,
    method: faker.helpers.arrayElement(METHODS),
    createdAt: faker.date.between({ from: '2025-09-21T00:00:00Z', to: NOW }).toISOString(),
    items,
  }
}

// Fixed rows with known ids so tests and reviewers can target them.
const FIXED = [
  {
    id: 'txn_FIXED_SUCCEEDED',
    reference: 'INV-00001',
    customer: { name: 'Selam Tadesse', email: 'selam@example.com' },
    amount: 1250,
    refundedAmount: 0,
    currency: 'ETB',
    status: 'succeeded',
    method: 'card',
    createdAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    items: [{ description: 'Monthly plan', quantity: 1, unitPrice: 1250 }],
  },
  {
    id: 'txn_FIXED_PARTIAL',
    reference: 'INV-00002',
    customer: { name: 'Dawit Bekele', email: 'dawit@example.com' },
    amount: 3000,
    refundedAmount: 1000,
    currency: 'ETB',
    status: 'partially_refunded',
    method: 'wallet',
    createdAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    items: [
      { description: 'Annual plan', quantity: 1, unitPrice: 2500 },
      { description: 'Setup fee', quantity: 1, unitPrice: 500 },
    ],
  },
  {
    id: 'txn_FIXED_REFUNDED',
    reference: 'INV-00003',
    customer: { name: 'Hanna Girma', email: 'hanna@example.com' },
    amount: 800,
    refundedAmount: 800,
    currency: 'ETB',
    status: 'refunded',
    method: 'bank_transfer',
    createdAt: '2026-06-01T08:00:00Z',
    items: [{ description: 'Starter pack', quantity: 2, unitPrice: 400 }],
  },
  {
    id: 'txn_FIXED_PENDING',
    reference: 'INV-00004',
    customer: { name: 'Yonas Alemu', email: 'yonas@example.com' },
    amount: 15999.99,
    refundedAmount: 0,
    currency: 'ETB',
    status: 'pending',
    method: 'bank_transfer',
    createdAt: new Date(NOW.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    items: [{ description: 'Enterprise licence', quantity: 1, unitPrice: 15999.99 }],
  },
  {
    id: 'txn_FIXED_FAILED',
    reference: 'INV-00005',
    customer: { name: 'Meron Haile', email: 'meron@example.com' },
    amount: 0.5,
    refundedAmount: 0,
    currency: 'ETB',
    status: 'failed',
    method: 'card',
    createdAt: '2026-09-20T23:59:59Z',
    items: [{ description: 'Micro top-up', quantity: 1, unitPrice: 0.5 }],
  },
  {
    // No email, very long reference and name — layout edge case.
    id: 'txn_FIXED_EDGE',
    reference: 'INV-VERY-LONG-REFERENCE-NUMBER-FROM-LEGACY-SYSTEM-2019-000000042',
    customer: { name: 'Woizero Tsehaynesh Gebremedhin Woldemariam Tesfaye', email: '' },
    amount: 999999.99,
    refundedAmount: 0,
    currency: 'ETB',
    status: 'succeeded',
    method: 'wallet',
    createdAt: '2026-01-15T10:30:00Z',
    items: Array.from({ length: 12 }, (_, i) => ({
      description: `Line item ${i + 1}`,
      quantity: 1,
      unitPrice: i === 11 ? 999999.99 - 11 * 1 : 1,
    })),
  },
]

export function createSeed() {
  faker.seed(SEED)
  const generated = Array.from({ length: ROW_COUNT - FIXED.length }, (_, i) => makeTransaction(i + 6))
  return [...FIXED.map((t) => structuredClone(t)), ...generated]
}

export const USERS = {
  // any username works; this is the display name fallback
  defaultName: (username) => username.charAt(0).toUpperCase() + username.slice(1),
}

export const PASSWORD = 'tally'
