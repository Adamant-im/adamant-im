function preloadCSS(html: string): string {
  return html.replace(
    /<link rel="stylesheet" href="(.*)">/g,
    `
    <link rel="preload" as="style" href="$1" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="$1"></noscript>
  `
  )
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
