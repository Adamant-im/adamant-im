import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatName } from '@/components/AChat/hooks/useChatName'
import { formatCryptoAddress, formatMultipleBTCAddresses } from '@/utils/address'
import { PendingTransaction } from '@/lib/pending-transactions'
import {
  BtcTransaction,
  CoinTransaction,
  DashTransaction,
  DogeTransaction
} from '@/lib/nodes/types/transaction'

type BtcLikeTransaction = BtcTransaction | DashTransaction | DogeTransaction

/**
 * Return either single sender or multiple senders separated by comma.
 * @examples
 *
 * - 1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP
 * - 1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP, 1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP
 *
 * @param transaction
 * @param type
 */
export function useBtcAddress(
  transaction: Ref<BtcLikeTransaction | undefined>,
  type: 'sender' | 'recipient'
) {
  return computed(() => {
    if (!transaction.value) return undefined

    const address = type === 'sender' ? transaction.value.senderId : transaction.value.recipientId
    const multiAddrs = type === 'sender' ? transaction.value.senders : transaction.value.recipients

    const isSingleAddress = address && (!multiAddrs || multiAddrs.length === 1)
    if (isSingleAddress) {
      return address
    } else if (multiAddrs) {
      return multiAddrs.join(', ')
    } else {
      return ''
    }
  })
}

/**
 * Return prettified sender addresses.
 * @examples
 *
 * - Me (1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP)
 * - Me and 1 more address
 * - Me and 2 more addresses
 *
 * @param transaction BTC, DOGE or DASH transaction
 * @param cryptoAddress Owner crypto address
 * @param admAddress Either sender or recipient ADM address
 * @param type
 */
export function useBtcAddressPretty(
  transaction: Ref<BtcLikeTransaction | PendingTransaction | undefined>,
  cryptoAddress: Ref<string>,
  admAddress: Ref<string>,
  type: 'sender' | 'recipient'
) {
  const { t } = useI18n()
  const chatName = useChatName(admAddress)

  return computed(() => {
    if (!transaction.value) return undefined

    const address = type === 'sender' ? transaction.value.senderId : transaction.value.recipientId
    const multiAddrs = type === 'sender' ? transaction.value.senders : transaction.value.recipients

    const isSingleAddress = address && (!multiAddrs || multiAddrs.length === 1)
    if (isSingleAddress) {
      return formatCryptoAddress(address, cryptoAddress.value, t, admAddress.value, chatName.value)
    } else if (multiAddrs) {
      return formatMultipleBTCAddresses(multiAddrs, cryptoAddress.value, t)
    } else {
      return undefined
    }
  })
}

/**
 * Return prettified sender or recipient address.
 *
 * @examples
 *
 * - U123456
 * - Me (U123456)
 * - John (U123456)
 *
 * @param transaction ETH, ERC20, KLY transaction
 * @param cryptoAddress Owner crypto address
 * @param admAddress Either sender or recipient ADM address
 * @param type
 */
export function useCryptoAddressPretty(
  transaction: Ref<CoinTransaction | undefined>,
  cryptoAddress: Ref<string>,
  admAddress: Ref<string>,
  type: 'sender' | 'recipient'
) {
  const { t } = useI18n()
  const chatName = useChatName(admAddress)

  return computed(() => {
    if (!transaction.value) return ''

    const address = type === 'sender' ? transaction.value.senderId : transaction.value.recipientId

    return formatCryptoAddress(address, cryptoAddress.value, t, admAddress.value, chatName.value)
  })
}
