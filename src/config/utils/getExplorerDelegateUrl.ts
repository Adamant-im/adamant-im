import config from '../index'

/**
 * Returns ADM explorer URL of a delegate
 *
 * @param username Delegate username
 */
export function getExplorerDelegateUrl(username: string): string {
  // The delegate name comes from a node response, so it is encoded before it becomes
  // part of a URL.
  return `${config.adm.explorer}/delegate/${encodeURIComponent(username)}`
}
