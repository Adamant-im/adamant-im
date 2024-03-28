export const formatBtcVersion = (version: number) => {
  const [major, minor, patch] = getBtcVersionParts(version)
  if (major === 0) {
    return `${major}.${minor}.${patch}`
  } else {
    return `${major}.${minor}`
  }
}

export const formatDogeVersion = (version: number) => {
  const [major, minor, patch] = getBtcVersionParts(version)
  return `${major}.${minor}.${patch}`
}

export const formatEthVersion = (version: string) => {
  const parts = version.split('/')
  const [clientName = '', fullVersion = ''] = parts
  const [simplifiedVersion = ''] = fullVersion.split('-')
  return { clientName, simplifiedVersion }
}

export const getBtcVersionParts = (version: number) =>
  version
    .toString()
    .padStart(8, '0')
    .match(/.{1,2}/g)
    ?.map(Number) || []
