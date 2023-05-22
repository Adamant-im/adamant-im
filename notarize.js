// eslint-disable-next-line @typescript-eslint/no-var-requires
const { notarize } = require('electron-notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== 'darwin') {
    return
  }

  if (process.env.SKIP_NOTARIZATION === 'true') {
    console.log('SKIP_NOTARIZATION=true | Skipping the notarization"')
    return
  }

  const appName = context.packager.appInfo.productFilename

  return notarize({
    appBundleId: 'im.adamant.msg',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
    teamId: process.env.APPLE_TEAM_ID
  })
}
