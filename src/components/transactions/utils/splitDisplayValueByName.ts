export type SplitDisplayValue = {
  main: string
  muted: string
}

/**
 * Splits formatted address text into regular and muted parts.
 *
 * We mute the bracket suffix only when it represents "name (address)".
 * For crypto fallback "address (ADM address)" we keep the whole value regular.
 */
export const splitDisplayValueByName = (
  formatted: string,
  rawAddress?: string
): SplitDisplayValue => {
  if (!formatted) {
    return {
      main: '',
      muted: ''
    }
  }

  const match = /^(.*?)(\s\(([^()]+)\))$/.exec(formatted)
  if (!match) {
    return {
      main: formatted,
      muted: ''
    }
  }

  const main = match[1]
  const bracketAddress = match[3]
  // The gap before the bracket is layout: kept outside the text so it survives bidi isolation
  const muted = `(${bracketAddress})`
  const hasRawAddress = Boolean(rawAddress)

  if (!hasRawAddress) {
    return {
      main,
      muted
    }
  }

  const isNameAndAddressView = main !== rawAddress || bracketAddress === rawAddress
  if (!isNameAndAddressView) {
    return {
      main: formatted,
      muted: ''
    }
  }

  return {
    main,
    muted
  }
}
