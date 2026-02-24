// `electron-builder` notarize hook is loaded as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { notarize } = require('@electron/notarize')
const fs = require('node:fs')
const path = require('node:path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv')
const logInfo = (...args) => console.info('[notarizing]', ...args)

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0

const loadEnvIfExists = (relativeFilePath) => {
  const absolutePath = path.resolve(process.cwd(), relativeFilePath)

  if (fs.existsSync(absolutePath)) {
    dotenv.config({ path: absolutePath, override: false, quiet: true })
  }
}

const bootstrapNotarizationEnv = () => {
  // Local convenience: allow notarization credentials in project env files
  // without overriding variables that are already provided by CI/shell.
  loadEnvIfExists('electron-builder.env.local')
  loadEnvIfExists('electron-builder.env')
  loadEnvIfExists('.env.local')
  loadEnvIfExists('.env')
}

exports.default = async function notarizing(context) {
  bootstrapNotarizationEnv()

  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== 'darwin') {
    return
  }

  if (process.env.APPLE_NOTARIZE !== 'true') {
    logInfo('APPLE_NOTARIZE=false | Skipping the notarization')
    return
  }

  const appName = context.packager.appInfo.productFilename

  logInfo(`Preparing the app ${appName} for notarization`)

  const options = {
    appPath: `${appOutDir}/${appName}.app`,
    tool: 'notarytool'
  }

  const keychainProfile = process.env.APPLE_KEYCHAIN_PROFILE
  const keychain = process.env.APPLE_KEYCHAIN
  const appleApiKey = process.env.APPLE_API_KEY
  const appleApiKeyId = process.env.APPLE_API_KEY_ID
  const appleApiIssuer = process.env.APPLE_API_ISSUER
  const appleId = process.env.APPLE_ID
  const appleIdPassword =
    process.env.APPLE_APP_SPECIFIC_PASSWORD ??
    process.env.APPLE_APP_PASSWORD ??
    process.env.APPLE_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID

  if (hasValue(keychainProfile)) {
    options.keychainProfile = keychainProfile

    if (hasValue(keychain)) {
      options.keychain = keychain
    }

    logInfo(`Using notarytool keychain profile "${keychainProfile}"`)
  } else if (hasValue(appleApiKey) && hasValue(appleApiKeyId)) {
    options.appleApiKey = path.resolve(appleApiKey)
    options.appleApiKeyId = appleApiKeyId

    if (hasValue(appleApiIssuer)) {
      options.appleApiIssuer = appleApiIssuer
    }

    logInfo(`Using App Store Connect API key "${appleApiKeyId}"`)
  } else if (hasValue(appleId) && hasValue(appleIdPassword) && hasValue(teamId)) {
    options.appleId = appleId
    options.appleIdPassword = appleIdPassword
    options.teamId = teamId

    logInfo(`Using Apple ID credentials for team "${teamId}"`)
  } else {
    throw new Error(
      'Notarization credentials are missing. Provide one strategy: ' +
        'APPLE_KEYCHAIN_PROFILE[+APPLE_KEYCHAIN], or APPLE_API_KEY+APPLE_API_KEY_ID[+APPLE_API_ISSUER], or APPLE_ID+APPLE_APP_SPECIFIC_PASSWORD+APPLE_TEAM_ID.'
    )
  }

  return notarize(options)
}
