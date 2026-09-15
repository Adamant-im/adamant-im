/**
 * Generated network configuration variants mapped to the `adamant-wallets` override they apply.
 * Variants are named after networks, not Vite modes: the `development` and `production` modes
 * both bundle `mainnet`, which uses the base (clearnet) metadata unchanged.
 *
 * `tor-testnet` is intentionally absent: the `tor` override describes mainnet endpoints, so it
 * must never be composed with the `testnet` override.
 */
export const NETWORK_CONFIG_VARIANTS = Object.freeze({
  mainnet: null,
  testnet: 'testnet',
  tor: 'tor'
})

/** Coin metadata fields written to `src/config/<variant>.json`, in output order */
export const NETWORK_CONFIG_FIELDS = Object.freeze([
  'explorer',
  'explorerTx',
  'explorerAddress',
  'nodes',
  'services'
])

/**
 * @param {string} variant Network configuration variant name
 * @returns {'testnet' | 'tor' | null} The metadata override key applied by the variant
 */
export function getNetworkOverrideKey(variant) {
  if (!Object.hasOwn(NETWORK_CONFIG_VARIANTS, variant)) {
    throw new Error(describeUnsupportedVariant(variant))
  }

  return NETWORK_CONFIG_VARIANTS[variant]
}

/**
 * Resolves one variant for every coin. Coins are sorted by key so that the output does not
 * depend on file system enumeration order.
 *
 * @param {Record<string, object>} coins Base coin metadata keyed by lowercase coin symbol
 * @param {string} variant Network configuration variant name
 * @returns {Record<string, object>} A new object that shares no references with `coins`
 */
export function resolveNetworkConfig(coins, variant) {
  getNetworkOverrideKey(variant)

  return Object.fromEntries(
    Object.keys(coins)
      .sort(compareCodeUnits)
      .map((key) => [key, resolveCoinNetworkConfig(coins[key], variant)])
  )
}

/**
 * Starts from a copy of the base network fields and applies the complete selected override.
 *
 * @param {object} coin Base coin metadata from `adamant-wallets`
 * @param {string} variant Network configuration variant name
 * @returns {object} Network fields of the variant in `NETWORK_CONFIG_FIELDS` order
 */
export function resolveCoinNetworkConfig(coin, variant) {
  const overrideKey = getNetworkOverrideKey(variant)
  const base = pickNetworkFields(coin)
  const override = overrideKey ? getOwnValue(coin, overrideKey) : undefined

  if (override === undefined) {
    return base
  }

  if (!isPlainObject(override)) {
    throw new Error(`Invalid "${overrideKey}" override for ${coin.symbol}: expected an object`)
  }

  return pickNetworkFields(mergeNetworkOverride(base, pickNetworkFields(override)))
}

/**
 * Deep-merges an override into a base value without mutating either argument.
 *
 * Plain objects are merged key by key. Arrays and scalar values from the override replace the
 * base value, so endpoint lists are replaced as a whole instead of being merged by index.
 *
 * @param {unknown} base
 * @param {unknown} override
 * @returns {unknown} A new value that shares no references with the arguments
 */
export function mergeNetworkOverride(base, override) {
  if (override === undefined) {
    return cloneJsonValue(base)
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return cloneJsonValue(override)
  }

  const keys = new Set([...Object.keys(base), ...Object.keys(override)])

  // `Object.fromEntries` defines own properties, so a metadata key such as `__proto__` cannot
  // replace the prototype of the merged object.
  return Object.fromEntries(
    [...keys].map((key) => [
      key,
      mergeNetworkOverride(getOwnValue(base, key), getOwnValue(override, key))
    ])
  )
}

/**
 * Locale-independent comparison for deterministic generated files.
 *
 * @param {string} first
 * @param {string} second
 * @returns {number}
 */
export function compareCodeUnits(first, second) {
  if (first === second) return 0

  return first < second ? -1 : 1
}

function pickNetworkFields(source) {
  return Object.fromEntries(
    NETWORK_CONFIG_FIELDS.filter((field) => getOwnValue(source, field) !== undefined).map(
      (field) => [field, cloneJsonValue(source[field])]
    )
  )
}

function getOwnValue(source, key) {
  return isPlainObject(source) && Object.hasOwn(source, key) ? source[key] : undefined
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

function cloneJsonValue(value) {
  return value === undefined ? undefined : structuredClone(value)
}

function describeUnsupportedVariant(variant) {
  const supported = Object.keys(NETWORK_CONFIG_VARIANTS).join(', ')

  if (variant === 'tor-testnet') {
    return (
      'Unsupported network configuration variant "tor-testnet": the "tor" override describes ' +
      `mainnet endpoints and cannot be combined with "testnet". Supported variants: ${supported}`
    )
  }

  return `Unsupported network configuration variant ${JSON.stringify(variant)}. Supported variants: ${supported}`
}
