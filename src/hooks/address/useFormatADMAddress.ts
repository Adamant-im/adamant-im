import { formatADMAddress } from '@/utils/address'
import { computed, MaybeRef, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { isStringEqualCI } from '@/lib/textHelpers'
import { useChatName } from '@/components/AChat/hooks/useChatName'

/**
 * Formats the user address.
 *
 * Examples:
 *
 * - Me (U1234567890)
 * - Jon (U0987654321)
 *
 * @param address ADM address
 */
export function useFormatADMAddress(address: MaybeRef<string>) {
  const store = useStore()
  const { t } = useI18n()

  const chatName = useChatName(address)

  return computed(() => {
    const addressValue = unref(address)

    let name = ''
    if (isStringEqualCI(addressValue, store.state.address)) {
      name = t('transaction.me')
    } else {
      name = chatName.value
    }

    return formatADMAddress(addressValue, name)
  })
}
