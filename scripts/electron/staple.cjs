// `electron-builder` afterAllArtifactBuild hook is loaded as CommonJS.
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv')

const logInfo = (...args) => console.info('[stapling]', ...args)

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0

const loadEnvIfExists = (relativeFilePath) => {
  const absolutePath = path.resolve(process.cwd(), relativeFilePath)

  if (fs.existsSync(absolutePath)) {
    dotenv.config({ path: absolutePath, override: false, quiet: true })
  }
}

const bootstrapEnv = () => {
  loadEnvIfExists('electron-builder.env.local')
  loadEnvIfExists('electron-builder.env')
  loadEnvIfExists('.env.local')
  loadEnvIfExists('.env')
}

const summarizeOutput = (text, maxLines = 8) => {
  if (!hasValue(text)) {
    return ''
  }

  const lines = text.trim().split('\n')

  if (lines.length <= maxLines) {
    return lines.join('\n')
  }

  return `${lines.slice(0, maxLines).join('\n')}\n... (${lines.length - maxLines} more lines)`
}

const runXcrun = (args, label) => {
  const result = spawnSync('xcrun', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (result.status !== 0) {
    const stdout = summarizeOutput(result.stdout)
    const stderr = summarizeOutput(result.stderr)
    const details = [stdout, stderr].filter(hasValue).join('\n')
    const detailsSuffix = hasValue(details) ? `\n${details}` : ''
    throw new Error(`${label} failed${detailsSuffix}`)
  }

  return hasValue(result.stdout) ? result.stdout.trim() : ''
}

const isStapled = (targetPath) => {
  const result = spawnSync('xcrun', ['stapler', 'validate', targetPath], {
    stdio: ['ignore', 'ignore', 'ignore']
  })

  return result.status === 0
}

const runStapler = (targetPath) => {
  if (isStapled(targetPath)) {
    return
  }

  try {
    runXcrun(['stapler', 'staple', targetPath], `Stapling ${targetPath}`)
  } catch (error) {
    if (isStapled(targetPath)) {
      return
    }

    throw error
  }
}

const runNotarytoolSubmit = (artifactPath, authArgs) => {
  const output = runXcrun(
    ['notarytool', 'submit', artifactPath, '--wait', '--output-format', 'json', ...authArgs],
    `Notarization submit ${artifactPath}`
  )

  try {
    return JSON.parse(output)
  } catch {
    return null
  }
}

const detectMacOutDir = (artifactName) => {
  if (artifactName.includes('-universal')) {
    return 'mac-universal'
  }

  if (artifactName.includes('-arm64')) {
    return 'mac-arm64'
  }

  return 'mac'
}

const resolveNotarytoolAuthArgs = () => {
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
    const args = ['--keychain-profile', keychainProfile]

    if (hasValue(keychain)) {
      args.push('--keychain', keychain)
    }

    return args
  }

  if (hasValue(appleApiKey) && hasValue(appleApiKeyId)) {
    const args = ['--key', path.resolve(appleApiKey), '--key-id', appleApiKeyId]

    if (hasValue(appleApiIssuer)) {
      args.push('--issuer', appleApiIssuer)
    }

    return args
  }

  if (hasValue(appleId) && hasValue(appleIdPassword) && hasValue(teamId)) {
    return ['--apple-id', appleId, '--password', appleIdPassword, '--team-id', teamId]
  }

  throw new Error(
    'Notarization credentials are missing. Provide one strategy: ' +
      'APPLE_KEYCHAIN_PROFILE[+APPLE_KEYCHAIN], or APPLE_API_KEY+APPLE_API_KEY_ID[+APPLE_API_ISSUER], or APPLE_ID+APPLE_APP_SPECIFIC_PASSWORD+APPLE_TEAM_ID.'
  )
}

exports.default = async function stapleArtifacts(buildResult) {
  bootstrapEnv()

  if (process.platform !== 'darwin') {
    return []
  }

  if (process.env.APPLE_NOTARIZE !== 'true') {
    logInfo('APPLE_NOTARIZE=false | Skipping stapling')
    return []
  }

  const outDir = buildResult.outDir
  const artifactPaths = Array.isArray(buildResult.artifactPaths) ? buildResult.artifactPaths : []
  const productName =
    buildResult.configuration?.productName ||
    buildResult.configuration?.extraMetadata?.productName ||
    'ADAMANT Messenger'

  const dmgPaths = artifactPaths
    .filter((artifactPath) => hasValue(artifactPath) && artifactPath.endsWith('.dmg'))
    .map((artifactPath) => path.resolve(artifactPath))
    .filter((artifactPath) => fs.existsSync(artifactPath))

  const appOutDirs = new Set(
    artifactPaths
      .filter((artifactPath) => hasValue(artifactPath) && (artifactPath.endsWith('.dmg') || artifactPath.endsWith('.zip')))
      .map((artifactPath) => detectMacOutDir(path.basename(artifactPath)))
  )

  const appPaths = Array.from(appOutDirs)
    .map((appOutDir) => path.join(outDir, appOutDir, `${productName}.app`))
    .filter((appPath) => fs.existsSync(appPath))

  const uniqueAppPaths = Array.from(new Set(appPaths))
  const uniqueDmgPaths = Array.from(new Set(dmgPaths))
  const authArgs = resolveNotarytoolAuthArgs()

  if (uniqueAppPaths.length === 0 && uniqueDmgPaths.length === 0) {
    logInfo('No staple targets found')
    return []
  }

  for (const appPath of uniqueAppPaths) {
    logInfo(`Stapling ${appPath}`)
    runStapler(appPath)
    logInfo(`Stapled ${path.basename(appPath)}`)
  }

  for (const dmgPath of uniqueDmgPaths) {
    logInfo(`Submitting ${dmgPath} for notarization`)
    const submission = runNotarytoolSubmit(dmgPath, authArgs)

    if (submission?.status && submission.status !== 'Accepted') {
      throw new Error(`Notarization returned non-accepted status for ${dmgPath}: ${submission.status}`)
    }

    if (hasValue(submission?.id)) {
      logInfo(`Notarized ${path.basename(dmgPath)} (${submission.id})`)
    } else {
      logInfo(`Notarized ${path.basename(dmgPath)}`)
    }

    logInfo(`Stapling ${dmgPath}`)
    runStapler(dmgPath)
    logInfo(`Stapled ${path.basename(dmgPath)}`)
  }

  return []
}
