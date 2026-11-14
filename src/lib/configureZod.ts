import { config } from 'zod'

// Web3.js creates schemas during import. Disable Zod's JIT before loading it.
config({ jitless: true })
