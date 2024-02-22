export const formatBtcVersion = (version: number) => version
    .toString()
    .padStart(8, '0')
    .match(/.{1,2}/g)
    ?.map(item => +item)
    .join('.') || ''

