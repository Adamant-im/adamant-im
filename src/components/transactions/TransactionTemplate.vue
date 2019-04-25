<template>
  <v-layout row wrap justify-center :class="className">

    <app-toolbar-centered
      app
      :title="`${id}`"
      flat
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
          <v-list-tile-content>
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.txid') }}
            </v-list-tile-title>
            <v-list-tile-sub-title :class="`${className}__value`">
              {{ id || placeholder }}
            </v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider/>

        <v-list-tile :title="sender || placeholder">
          <v-list-tile-content>
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.sender') }}
            </v-list-tile-title>
            <v-list-tile-sub-title :class="`${className}__value`">
              {{ sender || placeholder }}
            </v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider/>

        <v-list-tile :title="recipient || placeholder">
          <v-list-tile-content>
            <v-list-tile-title :class="`${className}__title`">
              {{ $t('transaction.recipient') }}
            </v-list-tile-title>
            <v-list-tile-sub-title :class="`${className}__value`">
              {{ recipient || placeholder }}
            </v-list-tile-sub-title>
          </v-list-tile-content>
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
              <v-icon>mdi-chevron-right</v-icon>
            </v-list-tile-title>
          </div>
        </v-list-tile>

        <v-list-tile v-if="partner" @click="openChat">
          <v-list-tile-content>
            <v-list-tile-title :class="`${className}__title`">
              {{ hasMessages ? $t('transaction.continueChat') : $t('transaction.startChat') }}
            </v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title :class="`${className}__value`">
              <v-icon>{{ hasMessages ? 'mdi-comment' : 'mdi-comment-outline' }}</v-icon>
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
    timestamp: {
      required: true,
      type: Number
    }
  },
  methods: {
    openInExplorer: function () {
      if (this.explorerLink) {
        window.open(this.explorerLink, '_blank')
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
  &__title, &__value
    font-weight: 300

/** Themes **/
.theme--light
  .transaction-view
    &__title
      color: $adm-colors.regular
    &__value
      color: $adm-colors.muted !important
    >>> .v-divider
      border-color: $adm-colors.secondary2
</style>
