import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

import type { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { isWelcomeChat } from '@/lib/chat/meta/utils'
import { vibrate } from '@/lib/vibrate'

/**
 * Manages async public-key fetching state for a single chat partner.
 *
 * Exposes:
 *  - `isGettingPublicKey` — true while the key fetch is in-flight
 *  - `isKeyMissing`       — true if partner has no key on-chain (permanent)
 *  - `shouldDisableInput` — combined "input must be disabled" flag
 *  - `createChat`         — triggers the fetch; safe to call multiple times
 *
 * Also installs a watcher on ADM node availability and retries `createChat`
 * whenever nodes come back online and the key is still absent.
 */
export function usePublicKeyFetch(partnerId: string) {
  const store = useStore()
  const { t } = useI18n()

  const isGettingPublicKey = ref(false)
  const isKeyMissing = ref(false)

  const shouldDisableInput = computed(
    () => isGettingPublicKey.value || isKeyMissing.value || !store.state.publicKeys[partnerId]
  )

  const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
  const areAdmNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))

  const createChat = (partnerName: string = '') => {
    isGettingPublicKey.value = true
    store
      .dispatch('chat/createChat', { partnerId, partnerName })
      .then(() => {
        isGettingPublicKey.value = false
      })
      .catch((error: unknown) => {
        vibrate.long()
        isGettingPublicKey.value = false

        const message = (error as Error).message

        if (message === t('chats.no_public_key')) {
          isKeyMissing.value = true
          return
        }

        // A key that does not derive the address it was returned for is a security failure, not
        // a transient one: the input stays disabled because nothing was cached, so without this
        // the user would be left with a dead composer and no explanation.
        if (message === t('chats.public_key_mismatch')) {
          isKeyMissing.value = true
          store.dispatch('snackbar/show', { message, timeout: 0 })
        }
      })
  }

  watch(areAdmNodesOnline, async (nodesOnline) => {
    if (!nodesOnline) return

    const needsKeyFetch =
      !isKeyMissing.value && !isWelcomeChat(partnerId) && !store.state.publicKeys[partnerId]

    if (isGettingPublicKey.value || needsKeyFetch) {
      const partnerName = store.getters['chat/getPartnerName'](partnerId)
      createChat(partnerName)
    }
  })

  return {
    isGettingPublicKey,
    isKeyMissing,
    shouldDisableInput,
    createChat
  }
}
