import { chromium } from 'playwright'
import path from 'node:path'

const cwd = process.cwd()
const outputDir = path.join(cwd, 'output/playwright/chat-placeholder-variants')
const logoPath = path.join(cwd, 'public/img/adamant-logo-transparent-512x512.png')
const logoUrl = `file://${logoPath}`

const items = [
  '🔐 End-to-end encrypted across all devices',
  '☁️ Decentralized IPFS storage for files/media',
  '🕶️ Anonymous: partners never see your IP address',
  '⛓️ Censorship-resistant blockchain architecture'
]

const variants = {
  current: {
    label: 'Current solid',
    dark: {
      cardBg: '#000000',
      border: '1px solid rgba(255,255,255,0.06)',
      shadow: '0 1px 10px rgba(255,255,255,0.06), 0 4px 18px rgba(0,0,0,0.28)',
      blur: 'none'
    },
    light: {
      cardBg: '#ffffff',
      border: '1px solid rgba(0,0,0,0.06)',
      shadow: '0 1px 10px rgba(0,0,0,0.06), 0 4px 18px rgba(0,0,0,0.08)',
      blur: 'none'
    }
  },
  tinted: {
    label: 'Tinted surface',
    dark: {
      cardBg: 'linear-gradient(180deg, rgba(26,31,37,0.94), rgba(18,22,28,0.94))',
      border: '1px solid rgba(255,255,255,0.07)',
      shadow: '0 10px 30px rgba(0,0,0,0.35)',
      blur: 'none'
    },
    light: {
      cardBg: 'linear-gradient(180deg, rgba(246,248,251,0.96), rgba(238,242,247,0.96))',
      border: '1px solid rgba(27,39,51,0.08)',
      shadow: '0 10px 30px rgba(76,94,116,0.12)',
      blur: 'none'
    }
  },
  glass: {
    label: 'Glass',
    dark: {
      cardBg: 'rgba(17, 21, 26, 0.58)',
      border: '1px solid rgba(255,255,255,0.10)',
      shadow: '0 16px 40px rgba(0,0,0,0.34)',
      blur: 'blur(16px) saturate(140%)'
    },
    light: {
      cardBg: 'rgba(255,255,255,0.58)',
      border: '1px solid rgba(26,39,51,0.10)',
      shadow: '0 16px 40px rgba(76,94,116,0.14)',
      blur: 'blur(16px) saturate(140%)'
    }
  },
  soft: {
    label: 'Soft outline',
    dark: {
      cardBg: 'linear-gradient(180deg, rgba(10,13,17,0.34), rgba(10,13,17,0.28))',
      border: '1px solid rgba(255,255,255,0.14)',
      shadow: '0 8px 24px rgba(0,0,0,0.24)',
      blur: 'blur(8px)'
    },
    light: {
      cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.36))',
      border: '1px solid rgba(26,39,51,0.10)',
      shadow: '0 8px 24px rgba(76,94,116,0.10)',
      blur: 'blur(8px)'
    }
  }
}

function renderPage(theme) {
  const pageTheme = theme === 'dark'
    ? {
        appBg: 'radial-gradient(circle at top left, #223247 0%, #12171d 42%, #0d1015 100%)',
        text: '#f2f5f8',
        muted: 'rgba(242,245,248,0.76)',
        labelBg: 'rgba(255,255,255,0.08)',
        labelBorder: 'rgba(255,255,255,0.08)',
        logoFilter: 'invert(1) brightness(1.08)',
        canvasOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))'
      }
    : {
        appBg: 'radial-gradient(circle at top left, #eef5fb 0%, #e7edf4 46%, #dde5ee 100%)',
        text: '#1f2a36',
        muted: 'rgba(31,42,54,0.76)',
        labelBg: 'rgba(20,33,46,0.06)',
        labelBorder: 'rgba(20,33,46,0.08)',
        logoFilter: 'none',
        canvasOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06))'
      }

  const cards = Object.values(variants)
    .map((variant) => {
      const style = variant[theme]
      const rows = items
        .map((item) => `<p class="placeholder-row">${item}</p>`)
        .join('')

      return `
        <section class="variant-card" style="--card-bg:${style.cardBg}; --card-border:${style.border}; --card-shadow:${style.shadow}; --card-blur:${style.blur};">
          <div class="variant-label">${variant.label}</div>
          <div class="placeholder-shell">
            <img class="placeholder-logo" src="${logoUrl}" alt="ADAMANT logo" />
            ${rows}
          </div>
        </section>
      `
    })
    .join('')

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Chat Placeholder Variants - ${theme}</title>
        <style>
          :root {
            color-scheme: ${theme};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            background: ${pageTheme.appBg};
            color: ${pageTheme.text};
          }
          .canvas {
            min-height: 100vh;
            padding: 48px;
            background: ${pageTheme.canvasOverlay};
          }
          .header {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 28px;
          }
          .title {
            margin: 0;
            font-size: 30px;
            line-height: 1.1;
            letter-spacing: 0.01em;
          }
          .subtitle {
            margin: 6px 0 0;
            font-size: 15px;
            line-height: 1.5;
            color: ${pageTheme.muted};
          }
          .theme-pill {
            border-radius: 999px;
            padding: 8px 12px;
            background: ${pageTheme.labelBg};
            border: 1px solid ${pageTheme.labelBorder};
            font-size: 13px;
            color: ${pageTheme.muted};
            white-space: nowrap;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px;
          }
          .variant-card {
            border-radius: 22px;
            padding: 18px;
            min-height: 420px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.04);
          }
          .variant-label {
            display: inline-flex;
            align-items: center;
            min-height: 32px;
            padding: 0 12px;
            border-radius: 999px;
            margin-bottom: 16px;
            background: ${pageTheme.labelBg};
            border: 1px solid ${pageTheme.labelBorder};
            color: ${pageTheme.muted};
            font-size: 13px;
          }
          .placeholder-shell {
            min-height: 332px;
            border-radius: 16px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 4px;
            background: var(--card-bg);
            border: var(--card-border);
            box-shadow: var(--card-shadow);
            backdrop-filter: var(--card-blur);
            -webkit-backdrop-filter: var(--card-blur);
          }
          .placeholder-logo {
            width: 100px;
            height: 100px;
            margin-bottom: 10px;
            filter: ${pageTheme.logoFilter};
            object-fit: contain;
          }
          .placeholder-row {
            width: 100%;
            margin: 0;
            text-align: center;
            font-size: 16px;
            line-height: 1.45;
            color: ${pageTheme.text};
          }
        </style>
      </head>
      <body>
        <main class="canvas">
          <div class="header">
            <div>
              <h1 class="title">Chat Placeholder Background Variants</h1>
              <p class="subtitle">Current baseline plus three alternatives for the placeholder surface.</p>
            </div>
            <div class="theme-pill">${theme === 'dark' ? 'Dark theme' : 'Light theme'}</div>
          </div>
          <div class="grid">${cards}</div>
        </main>
      </body>
    </html>
  `
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1180 }, deviceScaleFactor: 2 })

for (const theme of ['dark', 'light']) {
  await page.setContent(renderPage(theme), { waitUntil: 'load' })
  await page.screenshot({ path: path.join(outputDir, `chat-placeholder-variants-${theme}.png`) })
}

await browser.close()
