import { isStringEqualCI } from '@/lib/textHelpers'

/**
 * Formats BTC address.
 *
 * @param btcAddress BTC address
 * @param ownBtcAddress BTC address of the current account
 * @param t TFunction from `vue-i18n`
 * @param admAddress ADM address
 * @param partnerName Chat name
 */
export function formatBTCAddress(
  btcAddress: string,
  ownBtcAddress: string,
  t: (key: string) => string,
  admAddress = '',
  partnerName = ''
) {
  let name = ''

  const isMineAddress = isStringEqualCI(btcAddress, ownBtcAddress)

  if (isMineAddress) {
    name = t('transaction.me')
  } else {
    name = partnerName
  }

  let result = ''
  if (name !== '' && name !== undefined) {
    result = name + ' (' + btcAddress + ')'
  } else {
    result = btcAddress
    if (admAddress) {
      result += ' (' + admAddress + ')'
    }
  }

  return result
}
