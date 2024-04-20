<template>
  <div
    :class="{
      [classes.root]: true,
      [classes.nonClickable]: !!errorCode
    }"
  >
    <v-progress-circular v-if="loading" indeterminate size="16" />

    <div v-else-if="errorCode === ErrorCodes.INVALID_MESSAGE" :class="classes.invalidMessage">
      {{ '{ ' + $t('chats.invalid_message') + ' }' }}
    </div>

    <div v-else-if="errorCode === ErrorCodes.MESSAGE_NOT_FOUND" :class="classes.messageNotFound">
      {{ '{ ' + $t('chats.message_not_found') + ' }' }}
    </div>

    <div v-if="transaction" :class="classes.message">
      <template v-if="transferType === 'crypto'">
        <span>{{ cryptoTransferLabel }}</span>
      </template>
      <template v-else-if="transferType === 'image' || transferType === 'attachment'">
        <span>{{ transaction }}</span>
      </template>
      <template v-else-if="transferType === 'text'">
        <span v-html="messageLabel"></span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { getTransaction, decodeChat, DecodedChatMessageTransaction } from '@/lib/adamant-api'
import { NormalizedChatMessageTransaction, normalizeMessage } from '@/lib/chat/helpers'
import { Cryptos } from '@/lib/constants'
import currencyFormatter from '@/filters/currencyAmountWithSymbol'
import { formatMessage } from '@/lib/markdown'
import { ChatMessageTransaction } from '@/lib/schema/client/api'

const className = 'quoted-message'
const classes = {
  root: className,
  nonClickable: `${className}--non-clickable`,
  message: `${className}__message`,
  invalidMessage: `${className}__invalid-message`,
  messageNotFound: `${className}__message-not-found`
}

const ErrorCodes = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  PUBLIC_KEY_NOT_FOUND: 'PUBLIC_KEY_NOT_FOUND'
}

class ValidationError extends Error {
  private errorCode: string
  constructor(message: string, errorCode: (typeof ErrorCodes)[keyof typeof ErrorCodes]) {
    super(message)

    this.name = 'ValidationError'
    this.errorCode = errorCode
  }
}

async function fetchTransaction(transactionId: string, address: string) {
  const rawTx = await getTransaction(transactionId, 1)

  if (!rawTx) {
    throw new ValidationError(
      `QuotedMessage: Message not found: txId: ${transactionId}`,
      ErrorCodes.MESSAGE_NOT_FOUND
    )
  }

  let publicKey
  if ('recipientPublicKey' in rawTx) {
    publicKey = rawTx.senderId === address ? rawTx.recipientPublicKey : rawTx.senderPublicKey
  }
  if (!publicKey) {
    throw new ValidationError(
      `QuotedMessage: Cannot find public key: txId: ${transactionId}`,
      ErrorCodes.PUBLIC_KEY_NOT_FOUND
    )
  }
  const decodedTransaction =
    rawTx.type === 0 ? rawTx : decodeChat(rawTx as ChatMessageTransaction, publicKey)

  if (!('message' in decodedTransaction)) {
    throw new ValidationError(
      `QuotedMessage: Cannot decode the message: txId: ${transactionId}`,
      ErrorCodes.INVALID_MESSAGE
    )
  }

  return normalizeMessage(decodedTransaction as DecodedChatMessageTransaction)
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
    const { t } = useI18n()

    const loading = ref(false)
    const store = useStore()
    const errorCode = ref<(typeof ErrorCodes)[keyof typeof ErrorCodes] | null>(null)

    const stateTransaction = ref<NormalizedChatMessageTransaction | null>(null)
    const cachedTransaction = computed(() => store.getters['chat/messageById'](props.messageId))
    const transaction = computed(() => stateTransaction.value || cachedTransaction.value)

    const address = computed(() => store.state.address)
    const transferTypes = ['attachment', 'crypto', 'image', 'text'] as const

    const transferType = computed((): (typeof transferTypes)[number] => {
      if (!transaction.value) return 'text'

      const validCryptos = Object.keys(Cryptos)
      const imageExtensions = ['png', 'jpg', 'jpeg', 'bmp', 'gif']

      if (!transaction.value?.type && validCryptos.includes(transaction.value.type)) {
        return 'crypto'
      } else if (transaction.value.message.files && transaction.value.message.files.length > 0) {
        if (transaction.value.message.files[0].file_type.toLowerCase() === typeof imageExtensions) {
          return 'image'
        } else {
          return 'attachment'
        }
      } else return 'text'
    })

    const cryptoTransferLabel = computed(() => {
      const direction =
        transaction.value.senderId === address.value
          ? t('chats.sent_label')
          : t('chats.received_label')
      const amount = currencyFormatter(transaction.value.amount, transaction.value.type)
      const message = transaction.value.message ? `: ${transaction.value.message}` : ''

      return `${direction} ${amount}${message}`
    })

    const messageLabel = computed(() => {
      return store.state.options.formatMessages
        ? formatMessage(transaction.value.message)
        : transaction.value.message
    })

    onMounted(async () => {
      // fetch transaction if not found in the store
      if (!transaction.value) {
        loading.value = true

        try {
          const tx = await fetchTransaction(props.messageId, address.value)
          if (tx) {
            stateTransaction.value = tx
          }
        } catch (err: typeof Error | any) {
          if (err.errorCode) {
            errorCode.value = err.errorCode
          }

          console.warn(err)
        } finally {
          loading.value = false
        }
      }
    })

    return {
      classes,
      loading,
      transaction,
      transferType,
      address,
      currencyFormatter,
      errorCode,
      ErrorCodes,
      cryptoTransferLabel,
      messageLabel
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/settings/_colors.scss';
@import '@/assets/styles/themes/adamant/_mixins.scss';

.quoted-message {
  height: 32px;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;

  &--non-clickable {
    pointer-events: none;
  }

  &__message {
    @include a-text-regular();
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__invalid-message {
    font-style: italic;
  }

  &__message-not-found {
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
