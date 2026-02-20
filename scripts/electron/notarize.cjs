// eslint-disable-next-line @typescript-eslint/no-var-requires
import { logger } from '@/utils/devTools/logger'

const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== 'darwin') {
    return
  }

  if (process.env.APPLE_NOTARIZE !== 'true') {
    logger.log('notarizing', 'info', 'APPLE_NOTARIZE=false | Skipping the notarization"')
    return
  }

  const appName = context.packager.appInfo.productFilename

  logger.log("notarizing", 'info', `Preparing the app ${appName} for notarization`)

  return notarize({
    appPath: `${appOutDir}/${appName}.app`,
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  })
}
