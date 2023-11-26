import config from '../index'

/**
 * Returns ADM explorer URL of a delegate
 *
 * @param username Delegate username
 */
export function getExplorerDelegateUrl(username: string): string {
  return `${config.adm.explorer}/delegate/${username}`
}
