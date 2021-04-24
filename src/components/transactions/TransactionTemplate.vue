<template>
  <v-layout row wrap justify-center :class="className">

    <app-toolbar-centered
      app
      :title="`${id}`"
      flat
      :class="`${className}__toolbar`"
    />

    <container>

      <v-list class="transparent">

        <v-list-tile>
          <v-list-tile-content>
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

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title :class="`${className}__title`" style="width: fit-content;">
              {{ $t('transaction.status') + '&nbsp;&nbsp;&nbsp;' }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div :class="`${className}__value ${className}__value-${lowerCaseStatus}`">
              <v-icon v-if="status_inconsistent" size="20" style="color: #f8a061 !important;">{{ 'mdi-alert-outline' }}</v-icon>
              {{ $t(`transaction.statuses.${lowerCaseStatus}`) }}<span v-if="status_inconsistent">{{': ' + status_inconsistent }}</span>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
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

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
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

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
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

        <v-divider/>

        <v-list-tile :title="id || placeholder">
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.txid') }}
          </v-list-tile-title>

          <v-list-tile-title :class="`${className}__value`">
            {{ id || placeholder }}
          </v-list-tile-title>
        </v-list-tile>

        <v-divider/>

        <v-list-tile :title="sender || placeholder">
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.sender') }}
          </v-list-tile-title>

          <div :class="`${className}__value`">
            {{ sender || placeholder }}
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile :title="recipient || placeholder">
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.recipient') }}
          </v-list-tile-title>

          <div :class="`${className}__value`">
            {{ recipient || placeholder }}
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile v-if="comment" :title="comment">
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('transaction.comment') }}
          </v-list-tile-title>

          <div :class="`${className}__value`">
            {{ comment || placeholder }}
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile v-if="explorerLink" @click="openInExplorer">
          <v-list-tile-content>
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.explorer') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              <v-icon size="20">mdi-chevron-right</v-icon>
            </v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile v-if="partner && !ifComeFromChat" @click="openChat">
          <v-list-tile-content>
            <v-list-tile-title :class="`${className}__title`">
              {{ hasMessages ? $t('transaction.continueChat') : $t('transaction.startChat') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              <v-icon size="20">{{ hasMessages ? 'mdi-comment' : 'mdi-comment-outline' }}</v-icon>
            </v-list-tile-title>
          </div>
        </v-list-tile>

      </v-list>

    </container>

  </v-layout>
</template>

<script>
import { Symbols } from '@/lib/constants'

import AppToolbarCentered from '@/components/AppToolbarCentered'

export default {
  name: 'transaction-template',
  props: {
    amount: {
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
    status: {
      required: true,
      type: String
    },
    status_inconsistent: {
      required: false,
      type: String
    },
    timestamp: {
      required: true,
      type: Number
    },
    admTx: {
      required: false,
      type: Object
    }
  },
  methods: {
    openInExplorer: function () {
      if (this.explorerLink) {
        window.open(this.explorerLink, '_blank', 'resizable,scrollbars,status,noopener')
      }
    },
    openChat: function () {
      this.$router.push('/chats/' + this.partner + '/')
    }
  },
  computed: {
    className: () => 'transaction-view',
    hasMessages: function () {
      const chat = this.$store.state.chat.chats[this.partner]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    },
    placeholder () {
      if (!this.status) return Symbols.CLOCK
      return this.status === 'ERROR' ? Symbols.CROSS : Symbols.HOURGLASS
    },
    ifComeFromChat () {
      return this.$route.query.hasOwnProperty('fromChat')
    },
    lowerCaseStatus () {
      return this.status ? this.status.toLowerCase() : 'pending'
    },
    comment () {
      return this.admTx && this.admTx.message ? this.admTx.message : false
    }
  },
  components: {
    AppToolbarCentered
  }
}
</script>

<style lang="stylus" scoped>
@import '../../assets/stylus/settings/_colors.styl'

.transaction-view
  &__title
    font-weight: 300
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
    &__value-error
      color: $adm-colors.danger !important
    &__value-pending
      color: $adm-colors.attention !important
    &__value-success
      color: $adm-colors.good !important
    &__value-confirmed
      color: $adm-colors.good !important
    &__value-invalid
      color: $adm-colors.attention !important
</style>
