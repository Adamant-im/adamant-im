<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': isStringEqualCI(sender.id, userId) }"
  >
    <div
      class="a-chat__message"
      :class="{
        'a-chat__message--flashing': flashing
      }"
    >
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header">
          <div :title="timeTitle" class="a-chat__timestamp">
            {{ time }}
          </div>
          <div class="a-chat__status">
            <v-icon
              size="13"
              :icon="statusIcon"
              :title="statusTitle"
              :color="statusColor"
              :style="statusUpdatable ? 'cursor: pointer;' : 'cursor: default;'"
              @click="updateStatus"
            />
          </div>
        </div>

        <div v-if="isReply" class="a-chat__quoted-message">
          <quoted-message
            :message-id="asset.replyto_id"
            @click="$emit('click:quotedMessage', asset.replyto_id)"
          />
        </div>

        <div>
          <div class="a-chat__direction a-text-regular-bold">
            {{
              isStringEqualCI(sender.id, userId)
                ? $t('chats.sent_label')
                : $t('chats.received_label')
            }}
          </div>
          <div
            class="a-chat__amount"
            :class="isClickable ? 'a-chat__amount--clickable' : ''"
            @click="onClickAmount"
          >
            <v-row align="center" no-gutters>
              <slot name="crypto" />
              <div class="a-chat__rates-column d-flex ml-4">
                <span class="mb-1">{{ currencyFormatter(amount, crypto) }}</span>
                <span class="a-chat__rates">{{ historyRate }}</span>
              </div>
            </v-row>
          </div>
        </div>

        <div class="a-chat__message-card-body">
          <div class="a-chat__message-text mb-1 a-text-regular-enlarged">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tsIcon, tsUpdatable, tsColor } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import currencyAmount from '@/filters/currencyAmount'
import { timestampInSec } from '@/filters/helpers'
import currencyFormatter from '@/filters/currencyAmountWithSymbol'
import QuotedMessage from './QuotedMessage'

export default {
  components: {
    QuotedMessage
  },
  props: {
    id: {
      type: null,
      required: true
    },
    currency: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    time: {
      type: String,
      default: ''
    },
    timeTitle: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
    sender: {
      type: Object,
      required: true
    },
    amount: {
      type: [Number, String],
      default: 0
    },
    locale: {
      type: String,
      default: 'en'
    },
    status: {
      type: Object,
      required: true
    },
    isClickable: {
      type: Boolean,
      default: false
    },
    crypto: {
      type: String,
      default: 'ADM'
    },
    hash: {
      required: true,
      type: String
    },
    txTimestamp: {
      required: true
    },
    asset: {
      type: Object,
      // eslint-disable-next-line vue/require-valid-default-prop
      default: {}
    },
    isReply: {
      type: Boolean,
      default: false
    },
    /**
     * Highlight the message by applying a background flash effect
     */
    flashing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['mount', 'click:transaction', 'click:transactionStatus', 'click:quotedMessage'],
  computed: {
    statusTitle() {
      return this.$t(`chats.transaction_statuses.${this.status.virtualStatus}`)
    },
    statusIcon() {
      return tsIcon(this.status.virtualStatus)
    },
    statusUpdatable() {
      return tsUpdatable(this.status.virtualStatus, this.currency)
    },
    statusColor() {
      return tsColor(this.status.virtualStatus)
    },
    historyRate() {
      const amount = currencyAmount(this.amount, this.crypto)
      return (
        '~' +
        this.$store.getters['rate/historyRate'](
          timestampInSec(this.crypto, this.txTimestamp),
          amount,
          this.crypto
        )
      )
    }
  },
  watch: {
    txTimestamp() {
      this.getHistoryRates()
    }
  },
  mounted() {
    this.$emit('mount')
    this.getHistoryRates()
  },
  methods: {
    isStringEqualCI(string1, string2) {
      return isStringEqualCI(string1, string2)
    },
    onClickAmount() {
      if (this.isClickable) {
        this.$emit('click:transaction', this.id)
      }
    },
    updateStatus() {
      if (this.statusUpdatable) {
        this.$emit('click:transactionStatus', this.id)
      }
    },
    getHistoryRates() {
      this.$store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(this.crypto, this.txTimestamp)
      })
    },
    currencyFormatter
  }
}
</script>
