import { readFileSync } from 'node:fs'

const registry = 'https://registry.npmjs.org/'
const quarantineDays = 7
const earliestEligibleTime = Date.now() - quarantineDays * 24 * 60 * 60 * 1000
const { packages } = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const { packageManager } = JSON.parse(readFileSync('package.json', 'utf8'))
const versionsByName = new Map()

function recordVersion(name, version) {
  if (!versionsByName.has(name)) versionsByName.set(name, new Set())
  versionsByName.get(name).add(version)
}

for (const [path, entry] of Object.entries(packages)) {
  if (path === '') continue
  if (!entry.resolved?.startsWith(registry) || !entry.version) {
    throw new Error(`Cannot verify the npm release date for ${path}`)
  }
  recordVersion(entry.name ?? path.split('node_modules/').at(-1), entry.version)
}

const npmVersion = /^npm@([^+]+)(?:\+.*)?$/.exec(packageManager)?.[1]
if (!npmVersion) throw new Error('Expected a pinned npm version in package.json')
recordVersion('npm', npmVersion)

async function fetchReleaseDates(name) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(registry + encodeURIComponent(name), {
        signal: AbortSignal.timeout(15_000)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return (await response.json()).time
    } catch (error) {
      if (attempt === 3) throw new Error(`Cannot read npm metadata for ${name}`, { cause: error })
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
  }
}

const pending = versionsByName.entries()
const findings = []
await Promise.all(
  Array.from({ length: 16 }, async () => {
    for (const [name, versions] of pending) {
      try {
        const time = await fetchReleaseDates(name)
        for (const version of versions) {
          const published = Date.parse(time?.[version])
          if (!Number.isFinite(published)) {
            findings.push(`${name}@${version}: npm publication time is unavailable`)
          } else if (published > earliestEligibleTime) {
            findings.push(`${name}@${version}: published ${time[version]}`)
          }
        }
      } catch (error) {
        findings.push(error.message)
      }
    }
  })
)

if (findings.length > 0) {
  console.error(
    `Expected every npm version to be published on or before ${new Date(earliestEligibleTime).toISOString()}:`
  )
  console.error(findings.sort().join('\n'))
  process.exitCode = 1
} else {
  const versionCount = [...versionsByName.values()].reduce(
    (sum, versions) => sum + versions.size,
    0
  )
  console.log(`Verified the ${quarantineDays}-day release age for ${versionCount} npm versions`)
}
