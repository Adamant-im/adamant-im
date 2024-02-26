export const formatBtcVersion = (version: number) => {
  const parts = getBtcVersionParts(version)
  if (parts.length < 3) return ''
  if (parts[0] === 0) {
    return `v${parts[0]}.${parts[1]}.${parts[2]}`
  } else {
    return `v${parts[0]}.${parts[1]}`
  }
}

export const formatDogeVersion = (version: number) => {
  const parts = getBtcVersionParts(version)
  if (parts.length < 3) return ''
  return `v${parts[0]}.${parts[1]}.${parts[2]}`
}

export const formatEthVersion = (version: string) => {
  const parts = version.split('/')
  const clientName = parts.length > 0 ? parts[0] : ''
  const fullVersion = parts.length > 1 ? parts[1] : ''
  const simplifiedVersion = fullVersion.split('-')[0]
  return `${clientName}/${simplifiedVersion}`
}

export const getBtcVersionParts = (version: number) =>
  version
    .toString()
    .padStart(8, '0')
    .match(/.{1,2}/g)
    ?.map((item) => +item) || []
