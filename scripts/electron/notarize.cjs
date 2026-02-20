// `electron-builder` notarize hook is loaded as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { notarize } = require('@electron/notarize')
const logInfo = (...args) => console.info('[notarizing]', ...args)

exports.default = async function notarizing(context) {
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

  return notarize({
    appPath: `${appOutDir}/${appName}.app`,
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  })
}
