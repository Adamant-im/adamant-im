import { isStringEqualCI } from '@/lib/textHelpers'

/**
 * Formats a crypto address
 *
 * @param cryptoAddress Crypto address to format
 * @param ownCryptoAddress Crypto address of the current account
 * @param t TFunction from `vue-i18n`
 * @param admAddress ADM address
 * @param partnerName Chat name
 */
export function formatCryptoAddress(
  cryptoAddress: string,
  ownCryptoAddress: string,
  t: (key: string) => string,
  admAddress = '',
  partnerName = ''
) {
  const isMineAddress = isStringEqualCI(cryptoAddress, ownCryptoAddress)
  const name = isMineAddress ? t('transaction.me') : partnerName

  let result
  if (name) {
    result = cryptoAddress ? name + ' (' + cryptoAddress + ')' : name
  } else {
    result = cryptoAddress
    if (admAddress) {
      result += ' (' + admAddress + ')'
    }
  }

  return result
}
