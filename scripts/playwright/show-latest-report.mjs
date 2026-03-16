import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { exit, platform, stderr, stdout } from 'node:process'

const reportsRoot = path.resolve('playwright-report')

if (!existsSync(reportsRoot)) {
  stderr.write('No playwright-report directory found\n')
  exit(1)
}

const runDirectories = readdirSync(reportsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const htmlDir = path.join(reportsRoot, entry.name, 'html')
    return {
      name: entry.name,
      htmlDir,
      hasHtmlReport: existsSync(htmlDir)
    }
  })
  .filter((entry) => entry.hasHtmlReport)
  .sort((a, b) => {
    const aTime = statSync(path.join(reportsRoot, a.name)).mtimeMs
    const bTime = statSync(path.join(reportsRoot, b.name)).mtimeMs

    return aTime - bTime
  })

if (runDirectories.length === 0) {
  stderr.write('No Playwright HTML report directories found in playwright-report\n')
  exit(1)
}

const latestRunDir = runDirectories.at(-1)
if (!latestRunDir) {
  stderr.write('No latest Playwright run directory found\n')
  exit(1)
}

const latestHtmlReportDir = latestRunDir.htmlDir

stdout.write(`Opening latest Playwright report: ${latestHtmlReportDir}\n`)

const command = platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(command, ['playwright', 'show-report', latestHtmlReportDir], {
  stdio: 'inherit'
})

exit(result.status ?? 1)
