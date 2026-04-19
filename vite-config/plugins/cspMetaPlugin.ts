const CSP_POLICY =
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.adamant.im *.adm.im *.adamant.business *.blockchain2fa.io *.adamant.chat *.bbry.org",
    "object-src 'none'",
    "style-src 'self' data: 'unsafe-inline'",
    "img-src 'self' *.adamant.im *.adm.im *.adamant.business *.blockchain2fa.io *.adamant.chat *.bbry.org data: blob:",
    "media-src 'self' *.adamant.im *.adm.im *.adamant.business *.blockchain2fa.io *.adamant.chat *.bbry.org blob:",
    "frame-src 'none'",
    "font-src 'self'",
    "connect-src 'self' *.adamant.im *.adm.im *.adamant.business *.blockchain2fa.io *.adamant.chat *.bbry.org ws://*.adamant.im ws://*.adm.im ws://*.adamant.business ws://*.blockchain2fa.io ws://*.adamant.chat ws://*.bbry.org wss://*.adamant.im wss://*.adm.im wss://*.adamant.business wss://*.blockchain2fa.io wss://*.adamant.chat wss://*.bbry.org",
    "manifest-src 'self'",
    "prefetch-src 'self' *.adamant.im *.adm.im *.adamant.business *.blockchain2fa.io *.adamant.chat *.bbry.org"
  ].join('; ') + ';'

/**
 * Injects a `<meta http-equiv="Content-Security-Policy">` tag into the HTML.
 *
 * Used only in PWA builds (web/tor/GitHub Pages). Not added to Electron or
 * Android configs so their WebViews don't get a conflicting second CSP.
 */
export function cspMetaPlugin() {
  return {
    name: 'csp-meta-plugin',
    transformIndexHtml(html: string) {
      const metaTag = `<meta http-equiv="Content-Security-Policy" content="${CSP_POLICY}" />`
      return html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    ${metaTag}`)
    }
  }
}
