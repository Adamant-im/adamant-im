<template>
  <div :class="classes.root">
    <v-progress-circular v-if="loading" indeterminate size="16" />

    <div v-else-if="invalidMessage" :class="classes.invalidMessage">
      {{ $t('chats.invalid_message') }}
    </div>

    <div v-else-if="transaction" :class="classes.message">
      <span v-if="isCryptoTransfer">
        {{ transaction.senderId === address ? $t('chats.sent_label') : $t('chats.received_label') }}
        {{ currencyFormatter(transaction.amount, transaction.type) }}:
      </span>
      {{ transaction.message ? transaction.message : 'Empty message' }}
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useStore } from 'vuex'

import { getTransaction, decodeChat } from '@/lib/adamant-api'
import { transformMessage } from '@/lib/chatHelpers'
import { Cryptos } from '@/lib/constants'
import currencyFormatter from '@/filters/currencyAmountWithSymbol'

const className = 'quoted-message'
const classes = {
  root: className,
  message: `${className}__message`,
  invalidMessage: `${className}__invalid-message`
}

async function fetchTransaction(transactionId, address) {
  const rawTx = await getTransaction(transactionId, 1)
  const publicKey = rawTx.senderId === address ? rawTx.recipientPublicKey : rawTx.senderPublicKey
  const decodedTransaction = rawTx.type === 0 ? rawTx : decodeChat(rawTx, publicKey)

  return transformMessage(decodedTransaction)
}

export default defineComponent({
  props: {
    /**
     * Quoted message ID (see AIP-16: `replyto_id`)
     */
    messageId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const loading = ref(false)
    const store = useStore()
    const invalidMessage = ref(false)

    const stateTransaction = ref(null)
    const cachedTransaction = computed(() => store.getters['chat/messageById'](props.messageId))
    const transaction = computed(() => stateTransaction.value || cachedTransaction.value)

    const address = computed(() => store.state.address)
    const isCryptoTransfer = computed(() => {
      const validCryptos = Object.keys(Cryptos)

      return transaction.value ? validCryptos.includes(transaction.value.type) : false
    })

    onMounted(async () => {
      // fetch transaction if not found in the store
      if (!transaction.value) {
        loading.value = true

        try {
          stateTransaction.value = await fetchTransaction(props.messageId, address.value)
        } catch (err) {
          invalidMessage.value = true
          console.log(err)
        } finally {
          loading.value = false
        }
      }
    })

    return {
      classes,
      loading,
      transaction,
      isCryptoTransfer,
      address,
      currencyFormatter,
      invalidMessage
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../assets/styles/settings/_colors.scss';
@import '../../assets/styles/themes/adamant/_mixins.scss';

.quoted-message {
  height: 32px;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;

  &__message {
    @include a-text-regular();
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__invalid-message {
    font-style: italic;
  }
}

.v-theme--light {
  .quoted-message {
    border-left: 3px solid map-get($adm-colors, 'attention');
    background-color: map-get($adm-colors, 'secondary2');
    color: map-get($adm-colors, 'regular');
  }
}

.v-theme--dark {
  .quoted-message {
    border-left: 3px solid map-get($adm-colors, 'attention');
    background-color: map-get($adm-colors, 'secondary2-slightly-transparent');
    color: map-get($adm-colors, 'secondary');
  }
}
</style>
