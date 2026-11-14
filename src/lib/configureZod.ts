import { config } from 'zod'

// Web3.js creates Zod schemas during validation. Disable JIT before the first validation.
config({ jitless: true })
