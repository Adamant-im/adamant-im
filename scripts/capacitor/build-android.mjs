import dotenv from 'dotenv'
import { $ } from 'execa'
import process from 'node:process'

dotenv.config({
  path: 'capacitor.env'
})

void run()

async function run() {
  const $$ = $({ shell: true, stdout: 'inherit' })

  await $$`npm run android:prebuild` // build PWA
  await $$`cap sync` // copy web assets to ./android

  const releaseType = (process.env.ANDROID_RELEASE_TYPE || 'AAB').toUpperCase()
  const buildArgs = []

  // Pass each CLI flag and value as separate arguments to avoid parser issues
  pushIfSet(buildArgs, '--keystorepath', process.env.ANDROID_KEYSTORE_PATH)
  pushIfSet(buildArgs, '--keystorepass', process.env.ANDROID_KEYSTORE_PASSWORD)
  pushIfSet(buildArgs, '--keystorealias', process.env.ANDROID_KEYSTORE_ALIAS)
  pushIfSet(buildArgs, '--keystorealiaspass', process.env.ANDROID_KEYSTORE_ALIAS_PASSWORD)
  buildArgs.push('--androidreleasetype', releaseType)
  buildArgs.push('--signing-type', 'apksigner')

  await $$`cap build android ${buildArgs}`
}

function pushIfSet(args, flag, value) {
  if (value) {
    args.push(flag, value)
  }
}
