<template>
  <div class="transaction transaction_detail">
    <md-table>
      <md-table-body>
        <md-table-row >
          <md-table-cell class='label_td'>{{ $t('transaction.amount') }}</md-table-cell>
          <md-table-cell >{{ amount || placeholder }}</md-table-cell>
        </md-table-row>
        <md-table-row>
          <md-table-cell  class='label_td'>{{ $t('transaction.date') }}</md-table-cell>
          <md-table-cell >{{ timestamp ? $formatDate(timestamp) : placeholder }}</md-table-cell>
        </md-table-row>
        <md-table-row>
          <md-table-cell  class='label_td'>{{ $t('transaction.confirmations') }}</md-table-cell>
          <md-table-cell >{{ confirmations || placeholder }}</md-table-cell>
        </md-table-row>
        <md-table-row >
          <md-table-cell  class='label_td'>{{ $t('transaction.commission') }}</md-table-cell>
          <md-table-cell >{{ fee || placeholder }}</md-table-cell>
        </md-table-row>
        <md-table-row >
          <md-table-cell  class='label_td'>{{ $t('transaction.txid') }}</md-table-cell>
          <md-table-cell class='data_td'>{{ id || placeholder }}</md-table-cell>
        </md-table-row>
        <md-table-row >
          <md-table-cell  class='label_td'>{{ $t('transaction.sender') }}</md-table-cell>
          <md-table-cell class='data_td'>{{sender || placeholder }}</md-table-cell>
        </md-table-row>
        <md-table-row >
          <md-table-cell  class='label_td'>{{ $t('transaction.recipient') }}</md-table-cell>
          <md-table-cell class='data_td'>{{ recipient || placeholder }} </md-table-cell>
        </md-table-row>
        <md-table-row class='open_in_explorer' v-if="explorerLink">
          <md-table-cell  class='label_td'>
            <div v-on:click="openInExplorer">{{ $t('transaction.explorer') }}</div>
          </md-table-cell>
          <md-table-cell class='data_td'>
            <div v-on:click="openInExplorer">&gt;</div>
          </md-table-cell>
        </md-table-row>
        <md-table-row class='open_chat' v-if="partner">
          <md-table-cell class='label_td'>
            <div v-on:click="openChat">
              <md-icon class="md-size-2x">{{ hasMessages ? "chat" : "chat_bubble_outline" }}</md-icon>
              <span>{{ hasMessages ? $t('transaction.continueChat') : $t('transaction.startChat') }}</span>
            </div>
          </md-table-cell>
          <md-table-cell class='data_td'></md-table-cell>
        </md-table-row>
      </md-table-body>
    </md-table>
  </div>
</template>

<script>
import { Symbols } from '../../lib/constants'

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
      this.$store.commit('select_chat', this.partner)
      this.$router.push('/chats/' + this.partner + '/')
    }
  },
  computed: {
    hasMessages: function () {
      const chat = this.$store.state.chats[this.partner]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    },
    placeholder () {
      if (!this.status) return Symbols.CLOCK
      return this.status === 'ERROR' ? Symbols.CROSS : Symbols.HOURGLASS
    }
  }
}
</script>
<style>
  .label_td {
    text-align: left;
  }
  .transaction_detail {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .data_td {
    word-break: break-all;
  }
  @media (max-width: 380px) {
    .label_td {
      text-align:left;
      max-width:100px;
    }
  }

  .open_in_explorer {
    cursor: pointer;
  }

  .md-table .md-table-row.open_chat .md-table-cell.label_td .md-table-cell-container {
    display: inherit;
    cursor: pointer;
  }

  .md-table .md-table-row.open_chat .md-table-cell.label_td .md-icon {
    margin-left: -2px;
    margin-right: 8px;
  }
</style>
