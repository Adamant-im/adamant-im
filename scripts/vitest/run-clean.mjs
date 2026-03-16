import { spawn } from 'node:child_process'
import { argv, env, exit, platform } from 'node:process'

const command = platform === 'win32' ? 'npx.cmd' : 'npx'
const cleanEnv = { ...env, NODE_NO_WARNINGS: '1' }

const child = spawn(command, ['vitest', ...argv.slice(2)], {
  stdio: 'inherit',
  env: cleanEnv
})

child.on('exit', (code, signal) => {
  if (signal) {
    exit(1)
  }

  exit(code ?? 1)
})
