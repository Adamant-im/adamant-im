<template>
  <v-row
    justify="center"
    no-gutters
    :class="className"
  >
    <app-toolbar-centered
      app
      :title="`${id}`"
      flat
      fixed
      :class="`${className}__toolbar`"
    />
    <container class="container--with-app-toolbar">
      <v-list bg-color="transparent">
        <v-list-item>
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.amount') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title :class="`${className}__value`">
              {{ amount || placeholder }}
            </v-list-item-title>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.currentVal') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title
              v-if="rate !== false"
              :class="`${className}__value`"
            >
              {{ rate }}
            </v-list-item-title>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.valueTimeTxn') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title
              v-if="historyRate !== false"
              :class="`${className}__value`"
            >
              {{ historyRate }}
            </v-list-item-title>
          </div>
        </v-list-item>

        <v-divider />
        <v-list-item>
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.status') }}
              <v-icon
                v-if="statusUpdatable"
                ref="updateButton"
                icon="mdi-refresh"
                size="dense"
                @click="updateStatus()"
              />
            </v-list-item-title>
          </v-list-item-content>

          <div :class="`${className}__value ${className}__value-${status.virtualStatus}`">
            <v-icon
              v-if="status.status === 'INVALID'"
              icon="mdi-alert-outline"
              size="dense"
              style="color: #f8a061 !important;"
            />
            {{ $t(`transaction.statuses.${status.virtualStatus}`) }}<span v-if="status.status === 'INVALID'">{{ ': ' + $t(`transaction.inconsistent_reasons.${status.inconsistentReason}`, { crypto } ) }}</span><span v-if="status.addStatus">{{ ': ' + status.addDescription }}</span>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.date') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title :class="`${className}__value`">
              {{ timestamp ? $formatDate(timestamp) : placeholder }}
            </v-list-item-title>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.confirmations') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title :class="`${className}__value`">
              {{ confirmations || placeholder }}
            </v-list-item-title>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.commission') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title :class="`${className}__value`">
              {{ fee || placeholder }}
            </v-list-item-title>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item
          :title="id || placeholder"
          @click="copyToClipboard(id)"
        >
          <v-list-item-title :class="`${className}__title`">
            {{ $t('transaction.txid') }}
          </v-list-item-title>

          <v-list-item-title :class="`${className}__value`">
            {{ id || placeholder }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item
          :title="sender || placeholder"
          @click="copyToClipboard(sender)"
        >
          <v-list-item-title :class="`${className}__title`">
            {{ $t('transaction.sender') }}
          </v-list-item-title>

          <div :class="`${className}__value`">
            {{ senderFormatted || placeholder }}
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item
          :title="recipient || placeholder"
          @click="copyToClipboard(recipient)"
        >
          <v-list-item-title :class="`${className}__title`">
            {{ $t('transaction.recipient') }}
          </v-list-item-title>

          <div :class="`${className}__value`">
            {{ recipientFormatted || placeholder }}
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item
          v-if="comment"
          :title="comment"
        >
          <v-list-item-title :class="`${className}__title`">
            {{ $t('transaction.comment') }}
          </v-list-item-title>

          <div :class="`${className}__value`">
            {{ comment || placeholder }}
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item
          v-if="textData"
          :title="textData"
        >
          <v-list-item-title :class="`${className}__title`">
            {{ $t('transaction.textData') }}
          </v-list-item-title>

          <div :class="`${className}__value`">
            {{ textData || placeholder }}
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item
          v-if="explorerLink"
          @click="openInExplorer"
        >
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.explorer') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title :class="`${className}__value`">
              <v-icon
                icon="mdi-chevron-right"
                size="dense"
              />
            </v-list-item-title>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item
          v-if="partner && !ifComeFromChat"
          @click="openChat"
        >
          <v-list-item-content :class="`${className}__titlecontent`">
            <v-list-item-title :class="`${className}__title`">
              {{ hasMessages ? $t('transaction.continueChat') : $t('transaction.startChat') }}
            </v-list-item-title>
          </v-list-item-content>

          <div>
            <v-list-item-title :class="`${className}__value`">
              <v-icon
                :icon="hasMessages ? 'mdi-comment' : 'mdi-comment-outline'"
                size="20"
              />
            </v-list-item-title>
          </div>
        </v-list-item>
      </v-list>
    </container>
  </v-row>
</template>

<script>
import { nextTick } from 'vue'

import { Symbols, tsUpdatable } from '@/lib/constants'
import AppToolbarCentered from '@/components/AppToolbarCentered'
import transaction from '@/mixins/transaction'
import { copyToClipboard } from '@/lib/textHelpers'
import { timestampInSec } from '@/filters/helpers'

export default {
  name: 'TransactionTemplate',
  components: {
    AppToolbarCentered
  },
  mixins: [transaction],
  props: {
    amount: {
      required: true,
      type: String
    },
    crypto: {
      required: true,
      type: String
    },
    confirmations: {
      required: true,
      type: Number
    },
    explorerLink: {
      required: true,
      type: String
    },
    fee: {
      required: true,
      type: String
    },
    id: {
      required: true,
      type: String
    },
    partner: {
      required: true,
      type: String
    },
    recipient: {
      required: true,
      type: String
    },
    sender: {
      required: true,
      type: String
    },
    recipientFormatted: {
      required: true,
      type: String
    },
    senderFormatted: {
      required: true,
      type: String
    },
    status: {
      required: true,
      type: Object
    },
    timestamp: {
      required: true,
      type: Number
    },
    admTx: {
      required: false,
      type: Object
    },
    textData: {
      required: false,
      type: String
    }
  },
  computed: {
    className: () => 'transaction-view',
    hasMessages: function () {
      const chat = this.$store.state.chat.chats[this.partner]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    },
    placeholder () {
      if (!this.status.status) return Symbols.CLOCK
      return this.status.status === 'REJECTED' ? Symbols.CROSS : Symbols.HOURGLASS
    },
    ifComeFromChat () {
      return Object.prototype.hasOwnProperty.call(this.$route.query, 'fromChat')
    },
    comment () {
      return this.admTx && this.admTx.message ? this.admTx.message : false
    },
    statusUpdatable () {
      return tsUpdatable(this.status.virtualStatus, this.crypto)
    },
    amountNumber () {
      return this.amount.replace(/[^\d.-]/g, '')
    },
    historyRate () {
      return this.$store.getters['rate/historyRate'](timestampInSec(this.crypto, this.timestamp), this.amountNumber, this.crypto)
    },
    rate () {
      return this.$store.getters['rate/rate'](this.amountNumber, this.crypto)
    }
  },
  watch: {
    // fetch Tx status when we get admTx
    admTx () {
      this.fetchTransactionStatus(this.admTx, this.partner)
    },
    timestamp () {
      nextTick(() => {
        this.getHistoryRates()
      })
    }
  },
  mounted () {
    if (this.admTx) {
      this.fetchTransactionStatus(this.admTx, this.partner)
    }
    if (!isNaN(this.timestamp)) {
      this.getHistoryRates()
    }
  },
  methods: {
    copyToClipboard: function (key) {
      if (key) {
        copyToClipboard(key)
        this.$store.dispatch('snackbar/show', {
          message: this.$t('home.copied'),
          timeout: 2000
        })
      }
    },
    openInExplorer: function () {
      if (this.explorerLink) {
        window.open(this.explorerLink, '_blank', 'resizable,scrollbars,status,noopener')
      }
    },
    openChat: function () {
      this.$router.push('/chats/' + this.partner + '/')
    },
    updateStatus () {
      const el = this.$refs.updateButton.$el
      el.rotate = (el.rotate || 0) + 400
      el.style.transform = `rotate(${el.rotate}grad)`
      el.style['transition-duration'] = '1s'

      if (this.crypto && this.statusUpdatable) {
        this.$store.dispatch(this.crypto.toLowerCase() + '/updateTransaction', { hash: this.id, force: true, updateOnly: false, dropStatus: true })
      }
    },
    getHistoryRates () {
      this.$store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(this.crypto, this.timestamp)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/styles/settings/_colors.scss';

.transaction-view {
  &__title {
    font-weight: 300;
  }
  &__titlecontent {
    flex: 1 0 auto;
  }
  &__value {
    font-weight: 300;
    font-size: 14px;
    text-align: right;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    width: 100%;
  }
  &__toolbar {
    :deep(.v-toolbar__title) div {
      text-overflow: ellipsis;
      max-width: 100%;
      overflow: hidden;
    }
  }
}

/** Themes **/
.v-theme--light {
  .transaction-view {
    &__title {
      color: map-get($adm-colors, 'regular');
    }
    &__value {
      color: map-get($adm-colors, 'muted') !important;
    }
    :deep(.v-divider) {
      border-color: map-get($adm-colors, 'secondary2');
    }
  }
}
.v-theme--light, .v-theme--dark {
  .transaction-view {
    &__value-REJECTED {
      color: map-get($adm-colors, 'danger') !important;
    }
    &__value-PENDING {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__value-REGISTERED {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__value-CONFIRMED {
      color: map-get($adm-colors, 'good') !important;
    }
    &__value-INVALID {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__value-UNKNOWN {
      color: map-get($adm-colors, 'attention') !important;
    }
  }
}
</style>
