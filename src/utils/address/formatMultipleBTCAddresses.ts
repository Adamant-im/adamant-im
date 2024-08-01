/**
 * Format multiple BTC addresses
 *
 * @param addresses List of BTC addresses
 * @param ownBtcAddress BTC address of the current account
 * @param t TFunction from `vue-i18n`
 */
export function formatMultipleBTCAddresses(
  addresses: string[],
  ownBtcAddress: string,
  t: (key: string, count?: number) => string
) {
  const count = addresses.length

  return addresses.includes(ownBtcAddress)
    ? `${t('transaction.me_and_addresses', count - 1)}`
    : t('transaction.addresses', count)
}
