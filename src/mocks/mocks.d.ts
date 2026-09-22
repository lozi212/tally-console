// Ambient types for the vendored JavaScript mock API in this folder.
// The .js files are kept byte-identical to the supplied mock; nothing here changes them.

declare module './browser' {
  import type { SetupWorker } from 'msw/browser'
  export const worker: SetupWorker
}

declare module './server' {
  import type { SetupServerApi } from 'msw/node'
  export const server: SetupServerApi
}

declare module './handlers' {
  import type { RequestHandler } from 'msw'
  import type { Transaction, User } from '../types/transaction'
  export const handlers: RequestHandler[]
  export const config: {
    failures: boolean
    failureRate: number
    latency: [number, number]
  }
  export let db: { transactions: Transaction[]; sessions: Map<string, User> }
  export function resetDb(): void
}
