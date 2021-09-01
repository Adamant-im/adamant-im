<template>
  <v-layout
    row
    wrap
    justify-center
    :class="className"
  >
    <app-toolbar-centered
      app
      :title="`${id}`"
      flat
      :class="`${className}__toolbar`"
    />

    <container>
      <v-list class="transparent">
        <v-list-tile>
          <v-list-tile-content :class="`${className}__titlecontent`">
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.amount') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              {{ amount || placeholder }}
            </v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content :class="`${className}__titlecontent`">
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.status') }}
              <v-icon
                v-if="statusUpdatable"
                ref="updateButton"
                size="20"
                @click="updateStatus()"
              >
                mdi-refresh
              </v-icon>
            </v-list-tile-title>
          </v-list-tile-content>

          <div :class="`${className}__value ${className}__value-${status.virtualStatus}`">
            <v-icon
              v-if="status.status === 'INVALID'"
              size="20"
              style="color: #f8a061 !important;"
            >
              {{ 'mdi-alert-outline' }}
            </v-icon>
            {{ $t(`transaction.statuses.${status.virtualStatus}`) }}<span v-if="status.status === 'INVALID'">{{ ': ' + $t(`transaction.inconsistent_reasons.${status.inconsistentReason}`, { crypto } ) }}</span><span v-if="status.addStatus">{{ ': ' + status.addDescription }}</span>
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content :class="`${className}__titlecontent`">
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.date') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              {{ timestamp ? $formatDate(timestamp) : placeholder }}
            </v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content :class="`${className}__titlecontent`">
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.confirmations') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              {{ confirmations || placeholder }}
            </v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content :class="`${className}__titlecontent`">
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.commission') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              {{ fee || placeholder }}
            </v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile
          :title="id || placeholder"
          @click="copyToClipboard(id)"
        >
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.txid') }}
          </v-list-tile-title>

          <v-list-tile-title :class="`${className}__value`">
            {{ id || placeholder }}
          </v-list-tile-title>
        </v-list-tile>

        <v-divider />

        <v-list-tile
          :title="sender || placeholder"
          @click="copyToClipboard(sender)"
        >
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.sender') }}
          </v-list-tile-title>

          <div :class="`${className}__value`">
            {{ senderFormatted || placeholder }}
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile
          :title="recipient || placeholder"
          @click="copyToClipboard(recipient)"
        >
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.recipient') }}
          </v-list-tile-title>

          <div :class="`${className}__value`">
            {{ recipientFormatted || placeholder }}
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile
          v-if="comment"
          :title="comment"
        >
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.comment') }}
          </v-list-tile-title>

          <div :class="`${className}__value`">
            {{ comment || placeholder }}
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile
          v-if="textData"
          :title="textData"
        >
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.textData') }}
          </v-list-tile-title>

          <div :class="`${className}__value`">
            {{ textData || placeholder }}
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile
          v-if="explorerLink"
          @click="openInExplorer"
        >
          <v-list-tile-content :class="`${className}__titlecontent`">
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.explorer') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              <v-icon size="20">
                mdi-chevron-right
              </v-icon>
            </v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile
          v-if="partner && !ifComeFromChat"
          @click="openChat"
        >
          <v-list-tile-content :class="`${className}__titlecontent`">
            <v-list-tile-title :class="`${className}__title`">
              {{ hasMessages ? $t('transaction.continueChat') : $t('transaction.startChat') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              <v-icon size="20">
                {{ hasMessages ? 'mdi-comment' : 'mdi-comment-outline' }}
              </v-icon>
            </v-list-tile-title>
          </div>
        </v-list-tile>
      </v-list>
    </container>
  </v-layout>
</template>

<script>
import { Symbols, tsUpdatable } from '@/lib/constants'
import AppToolbarCentered from '@/components/AppToolbarCentered'

import transaction from '@/mixins/transaction'
import { copyToClipboard } from '@/lib/textHelpers'

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
    }
  },
  watch: {
    // fetch Tx status when we get admTx
    admTx () {
      this.fetchTransactionStatus(this.admTx, this.partner)
    }
  },
  mounted () {
    if (this.admTx) {
      this.fetchTransactionStatus(this.admTx, this.partner)
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
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../../assets/stylus/settings/_colors.styl'

.transaction-view
  &__title
    font-weight: 300
  &__titlecontent
    flex: 1 0 auto
  &__value
    font-weight: 300
    font-size: 14px
    text-align: right
    text-overflow: ellipsis
    overflow: hidden
    max-width: 100%
    width: 100%
  &__toolbar
    >>> .v-toolbar__title div
      text-overflow: ellipsis
      max-width: 100%
      overflow: hidden

/** Themes **/
.theme--light
  .transaction-view
    &__title
      color: $adm-colors.regular
    &__value
      color: $adm-colors.muted !important
    >>> .v-divider
      border-color: $adm-colors.secondary2

.theme--light, .theme--dark
  .transaction-view
    &__value-REJECTED
      color: $adm-colors.danger !important
    &__value-PENDING
      color: $adm-colors.attention !important
    &__value-REGISTERED
      color: $adm-colors.attention !important
    &__value-CONFIRMED
      color: $adm-colors.good !important
    &__value-INVALID
      color: $adm-colors.attention !important
    &__value-UNKNOWN
      color: $adm-colors.attention !important
</style>
