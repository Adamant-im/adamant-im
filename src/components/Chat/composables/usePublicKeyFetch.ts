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
 *  - `isKeyMismatch`      — true if a node answered with a key that is not this partner's
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
  // Deliberately not folded into `isKeyMissing`. That flag means "this account has never been
  // initialised on chain" — it drives the placeholder text and permanently suppresses further
  // fetches. A mismatch is the opposite situation: the account exists and the answer was wrong,
  // so the advice we now show the user ("try another node") has to remain actionable.
  const isKeyMismatch = ref(false)

  const shouldDisableInput = computed(
    () =>
      isGettingPublicKey.value ||
      isKeyMissing.value ||
      isKeyMismatch.value ||
      !store.state.publicKeys[partnerId]
  )

  const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
  const areAdmNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))

  const createChat = (partnerName: string = '') => {
    isGettingPublicKey.value = true
    // Cleared on every attempt: the previous answer came from whichever node was current then,
    // and this attempt may well reach a different one.
    isKeyMismatch.value = false
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
          isKeyMismatch.value = true
          store.dispatch('snackbar/show', { message, timeout: 0 })
        }
      })
  }

  watch(areAdmNodesOnline, async (nodesOnline) => {
    if (!nodesOnline) return

    // `isKeyMismatch` is intentionally absent from this condition: a bad answer from one node
    // is exactly the case that should be retried once the node set changes.
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
    isKeyMismatch,
    shouldDisableInput,
    createChat
  }
}
