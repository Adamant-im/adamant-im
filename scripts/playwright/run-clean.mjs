import { spawn } from 'node:child_process'
import { env, exit, platform, argv } from 'node:process'

const command = platform === 'win32' ? 'npx.cmd' : 'npx'
const cleanEnv = { ...env }

// Keep colored Playwright output if the parent requested it, but drop NO_COLOR
// so Node does not print "NO_COLOR is ignored due to FORCE_COLOR" warnings.
delete cleanEnv.NO_COLOR

const child = spawn(command, ['playwright', 'test', ...argv.slice(2)], {
  stdio: 'inherit',
  env: cleanEnv
})

child.on('exit', (code, signal) => {
  if (signal) {
    exit(1)
  }

  exit(code ?? 1)
})
