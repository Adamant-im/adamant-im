import dotenv from 'dotenv'
import { $ } from 'execa'
import { renameSync } from 'fs'
import { readFileSync } from 'fs'

dotenv.config({
  path: 'capacitor.env'
})

void run()

async function run() {
  const $$ = $({ shell: true, stdout: 'inherit' })

  await $$`npm run android:prebuild` // build PWA
  await $$`cap sync` // copy web assets to ./android

  const buildArgs = [
    '--keystorepath $ANDROID_KEYSTORE_PATH',
    '--keystorepass $ANDROID_KEYSTORE_PASSWORD',
    '--keystorealias $ANDROID_KEYSTORE_ALIAS',
    '--keystorealiaspass $ANDROID_KEYSTORE_ALIAS_PASSWORD',
    '--androidreleasetype $ANDROID_RELEASE_TYPE',
    '--signing-type apksigner'
  ]
  await $$`cap build android ${buildArgs}`


  const version = JSON.parse(readFileSync('package.json', 'utf-8')).version
  const src = 'android/app/build/outputs/apk/release/app-release-signed.apk'
  const dest = `android/app/build/outputs/apk/release/ADAMANT.Messenger-${version}-signed.apk`

  renameSync(src, dest)
}
