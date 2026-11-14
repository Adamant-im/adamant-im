import { readFileSync } from 'node:fs'

import {
  NPM_REGISTRY,
  QUARANTINE_DAYS,
  collectLockedVersions,
  evaluateReleaseAges,
  parseReleaseAgeExceptions
} from './dependency-release-age/releaseAge.mjs'

const EXCEPTIONS_FILE = '.github/dependency-release-age-exceptions.json'

const versionsByName = collectLockedVersions(
  JSON.parse(readFileSync('package-lock.json', 'utf8')),
  JSON.parse(readFileSync('package.json', 'utf8')).packageManager
)
const exceptions = parseReleaseAgeExceptions(
  JSON.parse(readFileSync('.github/dependency-release-age-exceptions.json', 'utf8'))
)

async function fetchReleaseDates(name) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(NPM_REGISTRY + encodeURIComponent(name), {
        signal: AbortSignal.timeout(15_000)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return (await response.json()).time
    } catch (error) {
      if (attempt === 3) return new Error(`cannot read npm metadata`, { cause: error })
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
  }
}

const pending = versionsByName.keys()
const releaseTimesByName = new Map()
await Promise.all(
  Array.from({ length: 16 }, async () => {
    for (const name of pending) {
      releaseTimesByName.set(name, await fetchReleaseDates(name))
    }
  })
)

const { earliestEligibleTime, versionCount, findings, exempted, notices } = evaluateReleaseAges({
  versionsByName,
  releaseTimesByName,
  exceptions
})

for (const notice of notices) {
  console.warn(process.env.GITHUB_ACTIONS === 'true' ? `::warning::${notice}` : notice)
}

if (exempted.length > 0) {
  console.log(`Reviewed release-age exceptions from ${EXCEPTIONS_FILE}:`)
  console.log(exempted.join('\n'))
}

if (findings.length > 0) {
  console.error(
    `Expected every npm version to be published on or before ${new Date(earliestEligibleTime).toISOString()}:`
  )
  console.error(findings.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Verified the ${QUARANTINE_DAYS}-day release age for ${versionCount} npm versions`)
}
