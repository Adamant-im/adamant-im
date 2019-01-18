<template>
  <v-layout row wrap justify-center>

    <app-toolbar
      :title="`#${id}`"
      flat
    />

    <v-flex xs12 sm12 md8 lg5>

      <v-list class="transparent">

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.amount') }}</v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title>{{ amount || placeholder }}</v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.date') }}</v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title>{{ timestamp ? $formatDate(timestamp) : placeholder }}</v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.confirmations') }}</v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title>{{ confirmations || placeholder }}</v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.commission') }}</v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title>{{ fee || placeholder }}</v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.txid') }}</v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title>{{ id || placeholder }}</v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.sender') }}</v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title>{{ sender || placeholder }}</v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.recipient') }}</v-list-tile-title>
          </v-list-tile-content>

          <div>
            <v-list-tile-title>{{ recipient || placeholder }}</v-list-tile-title>
          </div>
        </v-list-tile>

        <v-divider/>

        <v-list-tile v-if="explorerLink" @click="openInExplorer">
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('transaction.explorer') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile v-if="partner">
          <v-list-tile-content>
            <v-btn @click="openChat" flat>
              <v-icon left>{{ hasMessages ? 'mdi-comment' : 'mdi-comment-outline' }}</v-icon>
              {{ $t('transaction.startChat') }}
            </v-btn>
          </v-list-tile-content>
        </v-list-tile>

      </v-list>

    </v-flex>

  </v-layout>
</template>

<script>
import { Symbols } from '@/lib/constants'

import AppToolbar from '@/components/AppToolbar'

export default {
  name: 'transaction-template',
  props: [
    'amount',
    'timestamp',
    'id',
    'confirmations',
    'fee',
    'recipient',
    'sender',
    'explorerLink',
    'partner',
    'status'
  ],
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
    AppToolbar
  }
}
</script>
