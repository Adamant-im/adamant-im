export const NPM_REGISTRY = 'https://registry.npmjs.org/'
export const QUARANTINE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000
const EXCEPTION_KEYS = ['package', 'version', 'advisory', 'reason']
const ADVISORY_IDS = [/^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/, /^CVE-\d{4}-\d{4,}$/]
const EXACT_VERSIONS = [/^\d+\.\d+\.\d+$/, /^\d+\.\d+\.\d+[-+][0-9A-Za-z.+-]+$/]

const matchesAny = (patterns, value) => patterns.some((pattern) => pattern.test(value))

function recordVersion(versionsByName, name, version) {
  if (!versionsByName.has(name)) versionsByName.set(name, new Set())
  versionsByName.get(name).add(version)
}

/**
 * Lists every npm version the repository pins: lockfile entries and the npm release itself.
 *
 * @param {{ packages: Record<string, { name?: string, version?: string, resolved?: string }> }} lockfile
 * @param {string} packageManager The `packageManager` field of package.json
 * @returns {Map<string, Set<string>>}
 */
export function collectLockedVersions(lockfile, packageManager) {
  const versionsByName = new Map()

  for (const [path, entry] of Object.entries(lockfile.packages)) {
    if (path === '') continue
    if (!entry.resolved?.startsWith(NPM_REGISTRY) || !entry.version) {
      throw new Error(`Cannot verify the npm release date for ${path}`)
    }
    recordVersion(versionsByName, entry.name ?? path.split('node_modules/').at(-1), entry.version)
  }

  // Corepack may append an integrity hash after "+".
  const npmVersion = packageManager?.startsWith('npm@')
    ? packageManager.slice('npm@'.length).split('+')[0]
    : ''
  if (!npmVersion) throw new Error('Expected a pinned npm version in package.json')
  recordVersion(versionsByName, 'npm', npmVersion)

  return versionsByName
}

/**
 * Validates the reviewed list of versions that may skip the quarantine.
 * An exception is tied to one exact version and to the advisory that makes the update urgent.
 *
 * @param {unknown} value Parsed content of the exceptions file
 * @returns {Map<string, { package: string, version: string, advisory: string, reason: string }>}
 */
export function parseReleaseAgeExceptions(value) {
  if (!Array.isArray(value)) {
    throw new Error('Release-age exceptions must be a JSON array')
  }

  const exceptions = new Map()

  value.forEach((entry, index) => {
    const label = `Release-age exception #${index + 1}`
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`${label} must be an object`)
    }

    const unknownKey = Object.keys(entry).find((key) => !EXCEPTION_KEYS.includes(key))
    if (unknownKey) throw new Error(`${label} has an unknown field "${unknownKey}"`)

    for (const key of EXCEPTION_KEYS) {
      if (typeof entry[key] !== 'string' || entry[key].trim() === '') {
        throw new Error(`${label} needs a non-empty "${key}" string`)
      }
    }
    if (!matchesAny(EXACT_VERSIONS, entry.version)) {
      throw new Error(`${label} must pin one exact version, got "${entry.version}"`)
    }
    if (!matchesAny(ADVISORY_IDS, entry.advisory)) {
      throw new Error(`${label} must reference a GHSA or CVE identifier, got "${entry.advisory}"`)
    }

    const id = `${entry.package}@${entry.version}`
    if (exceptions.has(id)) throw new Error(`${label} repeats ${id}`)
    exceptions.set(id, { ...entry })
  })

  return exceptions
}

/**
 * Compares publication times with the quarantine and applies the reviewed exceptions.
 * Missing data is always a finding: an exception cannot cover a version that cannot be dated.
 *
 * @param {object} options
 * @param {Map<string, Set<string>>} options.versionsByName
 * @param {Map<string, Record<string, string> | Error | undefined>} options.releaseTimesByName
 *   The `time` map of each packument, or the error that prevented reading it
 * @param {ReturnType<typeof parseReleaseAgeExceptions>} [options.exceptions]
 * @param {number} [options.now]
 * @returns {{ earliestEligibleTime: number, versionCount: number, findings: string[], exempted: string[], notices: string[] }}
 */
export function evaluateReleaseAges({
  versionsByName,
  releaseTimesByName,
  exceptions = new Map(),
  now = Date.now()
}) {
  const earliestEligibleTime = now - QUARANTINE_DAYS * DAY_MS
  const findings = []
  const exempted = []
  const notices = []
  const lockedIds = new Set()
  let versionCount = 0

  for (const [name, versions] of versionsByName) {
    const times = releaseTimesByName.get(name)

    for (const version of versions) {
      const id = `${name}@${version}`
      const exception = exceptions.get(id)
      lockedIds.add(id)
      versionCount++

      if (times instanceof Error) {
        findings.push(`${id}: ${times.message}`)
        continue
      }

      const published = Date.parse(times?.[version])
      if (!Number.isFinite(published)) {
        findings.push(`${id}: npm publication time is unavailable`)
      } else if (published <= earliestEligibleTime) {
        if (exception) {
          notices.push(`${id}: the exception is no longer needed, remove it`)
        }
      } else if (exception) {
        exempted.push(`${id}: published ${times[version]}, allowed by ${exception.advisory}`)
      } else {
        findings.push(`${id}: published ${times[version]}`)
      }
    }
  }

  for (const id of exceptions.keys()) {
    if (!lockedIds.has(id)) {
      findings.push(`${id}: the exception does not match a locked version, remove it`)
    }
  }

  return {
    earliestEligibleTime,
    versionCount,
    findings: findings.sort(),
    exempted: exempted.sort(),
    notices: notices.sort()
  }
}
