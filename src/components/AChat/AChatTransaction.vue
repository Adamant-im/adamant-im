<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': isStringEqualCI(sender.id, userId) }"
  >
    <div
      class="a-chat__message"
    >
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header">
          <div
            :title="timeTitle"
            class="a-chat__timestamp"
          >
            {{ time }}
          </div>
          <div class="a-chat__status">
            <v-icon
              size="13"
              :title="statusTitle"
              :color="statusColor"
              :style="statusUpdatable ? 'cursor: pointer;': 'cursor: default;'"
              @click="updateStatus"
            >
              {{ statusIcon }}
            </v-icon>
          </div>
        </div>

        <div>
          <div class="a-chat__direction a-text-regular-bold">
            {{ isStringEqualCI(sender.id, userId) ? $t('chats.sent_label') : $t('chats.received_label') }}
          </div>
          <div
            class="a-chat__amount"
            :class="isClickable ? 'a-chat__amount--clickable': ''"
            @click="onClickAmount"
          >
            <v-layout align-center>
              <slot name="crypto" />
              <div class="a-chat__rates-column d-flex ml-2">
                <span class="mb-1">{{ amount | currency(crypto) }}</span>
                <span class="a-chat__rates">{{ historyRate }}</span>
              </div>
            </v-layout>
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

export default {
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
    }
  },
  computed: {
    statusTitle () {
      return this.$t(`chats.transaction_statuses.${this.status.virtualStatus}`)
    },
    statusIcon () {
      return tsIcon(this.status.virtualStatus)
    },
    statusUpdatable () {
      return tsUpdatable(this.status.virtualStatus, this.currency)
    },
    statusColor () {
      return tsColor(this.status.virtualStatus)
    },
    transaction () {
      let transaction
      if (this.crypto === 'ADM') {
        transaction = this.$store.state.adm.transactions[this.hash] || { }
      } else {
        transaction = this.$store.getters[`${this.crypto.toLowerCase()}/transaction`](this.hash) || {}
      }
      return transaction
    },
    historyRate () {
      const amount = currencyAmount(this.amount, this.crypto)
      return '~' + this.$store.getters['rate/historyRate'](timestampInSec(this.crypto, this.transaction.timestamp), amount, this.crypto)
    }
  },
  watch: {
    transaction () {
      if (this.transaction.amount) {
        this.getHistoryRates()
      }
    }
  },
  mounted () {
    this.$emit('mount')
    this.$store.dispatch(`${this.crypto.toLowerCase()}/getTransaction`, { hash: this.hash })
  },
  methods: {
    isStringEqualCI (string1, string2) {
      return isStringEqualCI(string1, string2)
    },
    onClickAmount () {
      if (this.isClickable) {
        this.$emit('click:transaction', this.id)
      }
    },
    updateStatus () {
      if (this.statusUpdatable) {
        this.$emit('click:transactionStatus', this.id)
      }
    },
    getHistoryRates () {
      this.$store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(this.crypto, this.transaction.timestamp)
      })
    }
  }
}
</script>
