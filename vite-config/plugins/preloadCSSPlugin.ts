function preloadCSS(html: string): string {
  const styleRegx = /\n.*<link rel="stylesheet" href=".*">/
  const linkTag = html.match(styleRegx)
  if (linkTag === null) {
    return html
  }

  const linkTagPreloaded = linkTag[0].replace(
    'rel="stylesheet"',
    'rel="preload" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"'
  )

  return html.replace(styleRegx, linkTagPreloaded + `<noscript>${linkTag}</noscript>`)
}

/**
 * Adds `rel="preload"` to stylesheets
 *
 * e.g. `<link rel="stylesheet" href="app.css">`
 *      `<link rel="preload" href="app.css" as="style" onload="this.onload=null;this.rel='stylesheet'"`
 */
export function preloadCSSPlugin() {
  return {
    name: 'preload-css-plugin',
    transformIndexHtml: (html: string) => preloadCSS(html)
  }
}
