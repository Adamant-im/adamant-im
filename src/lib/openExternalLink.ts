import { logger } from '@/utils/devTools/logger'
import { ALLOWED_URI_PROTOCOLS } from '@/lib/uriSchemes'

/**
 * Opens a URL outside the application.
 *
 * Every external link goes through here so that the scheme is checked in one place. On the
 * desktop build the Electron main process turns this into `shell.openExternal`, so the page
 * opens in the user's real browser — with an address bar, an up-to-date engine and their own
 * extensions — instead of in a chrome-less Electron window that cannot be inspected.
 *
 * Some of these URLs are built from node-supplied values (delegate names, explorer links from
 * the wallet spec), which is why the check is not skipped for "internal" links.
 * @returns {boolean} whether the link was opened
 */
export function openExternalLink(url: string | undefined | null): boolean {
  if (!url) return false

  let scheme: string

  try {
    scheme = new URL(url, window.location.href).protocol
  } catch {
    logger.warn('openExternalLink', `Refused to open an unparsable URL: ${url}`)
    return false
  }

  if (!ALLOWED_URI_PROTOCOLS.has(scheme)) {
    logger.warn('openExternalLink', `Refused to open a URL with scheme "${scheme}"`)
    return false
  }

  window.open(url, '_blank', 'resizable,scrollbars,status,noopener,noreferrer')

  return true
}
