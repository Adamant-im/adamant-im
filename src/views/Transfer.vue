<template>
  <div class="transfer">
    <md-toolbar>
      <md-button class="md-icon-button" @click="backOneStep">
        <md-icon >keyboard_backspace</md-icon>
      </md-button>
      <h1 class="md-title">{{ $t('home.send_btn') }}</h1>
    </md-toolbar>
      <!--<spinner v-if="isWaiting" />-->
      <form novalidate @submit.stop.prevent="submit">
        <md-input-container>
          <md-select v-model="crypto" style="text-align: left;" :disabled="!!this.fixedCrypto">
            <md-option v-for="c in cryptosList" v-bind:key="c" :value="c">
              {{ c }}
            </md-option>
          </md-select>
        </md-input-container>
          <md-input-container :title="!this.fixedAddress ? $t('transfer.to_address_label_tooltip') : ''">
            <label>{{ addressLabel }}</label>
            <md-input v-model="targetAddress" :readonly="!!this.fixedAddress"></md-input>
          </md-input-container>
          <md-layout>
            <md-layout>
              <md-input-container>
                <label style="text-align:left" class="amount-label">
                  {{ $t('transfer.amount_label') }} <span style="font-size: 10px;">(max: {{ maxToTransfer }} {{ crypto }})</span>
                </label>
                <md-input type="number" min=0 :max="maxToTransfer" v-model="targetAmount"></md-input>
              </md-input-container>
            </md-layout>
          </md-layout>

          <md-input-container>
              <label>{{ $t('transfer.commission_label') }}</label>
              <md-input type="text" readonly v-model="commissionString"></md-input>
          </md-input-container>
          <md-input-container v-if="!this.hideTotal">
              <label style="text-align:left">{{ $t('transfer.final_amount_label') }}</label>
              <md-input type="number" readonly v-model="finalAmount"></md-input>
          </md-input-container>

          <md-input-container v-if="this.fixedAddress && this.crypto !== 'ADM'">
            <label>{{ $t('transfer.comments_label') }}</label>
            <md-input v-model="comments" maxlength='100'></md-input>
          </md-input-container>

          <md-layout md-align="center" md-gutter="16">
            <md-button class="md-raised send_funds_button" :title="$t('transfer.send_button_tooltip')" v-on:click="transfer">
              {{ $t('transfer.send_button') }}
            </md-button>
          </md-layout>
      </form>
      <md-snackbar md-position="bottom center" md-accent ref="transferSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
      <md-dialog-confirm
              :md-title="$t('transfer.confirm_title')"
              :md-content-html="confirmMessage"
              :md-ok-text="$t('transfer.confirm_approve')"
              :md-cancel-text="$t('transfer.confirm_cancel')"
              @close="onClose"
              ref="confirm_transfer_dialog">
      </md-dialog-confirm>
      <Spinner v-if="showLoader"></Spinner>
  </div>
</template>

<script>
import Spinner from '@/components/Spinner.vue'

import validateAddress from '../lib/validateAddress'
import { Cryptos, CryptoAmountPrecision, Fees, isErc20 } from '../lib/constants'
import { sendTokens, sendMessage } from '../lib/adamant-api'
import Vue from 'vue'
import utils from '../lib/adamant'
import { changeMessageClass, replaceMessageAndDelete, updateLastChatMessage } from '../store'

export default {
  name: 'home',
  components: { Spinner },
  methods: {
    backOneStep () {
      if (history.length > 2) {
        this.$router.back()
      } else {
        this.$router.push('/home/')
      }
    },
    errorMessage (message, opts) {
      this.formErrorMessage = this.$t('transfer.' + message, opts)
      this.$refs.transferSnackbar.open()
    },
    onClose (type) {
      if (!this.$store.getters.checkForActiveNode) {
        this.errorMessage('error_transaction_send')
        return
      }
      if (type !== 'ok') return
      this.isWaiting = true
      this.showLoader = true
      this.sendTokens().then(
        hash => {
          this.isWaiting = false

          if (!hash) {
            // No hash: transaction has been rejected
            this.errorMessage('error_transaction_send')
            this.showLoader = false
            return
          }

          if (this.fixedAddress) {
            // Go back to chat if we came from there
            this.showLoader = false
            this.$router.push({ name: 'Chat', params: { partner: this.fixedAddress } })
          } else {
            // View the newly created transaction
            const params = { crypto: this.crypto, tx_id: hash }
            this.showLoader = false
            this.$router.push({ name: 'Transaction', params })
          }
        },
        err => {
          console.error(err)
          this.showLoader = false
          this.isWaiting = false
          this.errorMessage('error_transaction_send')
        }
      )
    },
    sendTokens () {
      if (this.crypto === Cryptos.ADM) {
        const message = { to: this.targetAddress, message: this.comments, amount: this.targetAmount, fundType: this.crypto }
        let chats = this.$store.getters.getChats
        const partner = message.to
        const partnerTransactionsCount = (this.$store.getters['adm/partnerTransactions'](partner)).length
        let handledPayload = {
          ...message,
          amount: message.amount * 100000000,
          timestamp: utils.epochTime(),
          message: message.message,
          direction: 'from',
          confirm_class: 'sent',
          id: this.$store.getters.getCurrentChatMessageCount + partnerTransactionsCount + 1
        }
        let currentDialogs = chats[partner]
        // if the user is in the chat list, save message
        if (currentDialogs) {
          if (handledPayload.message === '') {
            handledPayload.message = 'sent ' + (message.amount) + ' ' + message.fundType
            handledPayload.message = handledPayload.message.replace(/<p>|<\/p>/g, '')
            updateLastChatMessage(currentDialogs, handledPayload, 'sent', 'from', handledPayload.id)
            handledPayload.message = ''
          } else {
            handledPayload.message = handledPayload.message.replace(/<p>|<\/p>/g, '')
            updateLastChatMessage(currentDialogs, handledPayload, 'sent', 'from', handledPayload.id)
          }
          Vue.set(chats[partner].messages, handledPayload.id, handledPayload)
        }
        const promise = (this.comments && this.fixedAddress)
          ? sendMessage(message)
          : sendTokens(this.targetAddress, this.targetAmount)
        return promise.then(response => {
          // if the user is in the chat list, save message
          if (currentDialogs) {
            if (response.success) {
              replaceMessageAndDelete(chats[partner].messages, response.transactionId, handledPayload.id, 'sent')
              handledPayload.message = 'sent ' + (message.amount) + ' ' + message.fundType
              updateLastChatMessage(currentDialogs, handledPayload, 'sent', 'from', response.transactionId)
            } else {
              changeMessageClass(chats[partner].messages, handledPayload.id, 'rejected')
              handledPayload.message = 'sent ' + (message.amount) + ' ' + message.fundType
              updateLastChatMessage(currentDialogs, handledPayload, 'rejected', 'from', message.id)
            }
          }
          return response.transactionId
        })
      } else {
        // Check for existing chat by eth address
        return this.$store.dispatch(this.crypto.toLowerCase() + '/sendTokens', {
          amount: this.targetAmount,
          admAddress: this.fixedAddress,
          ethAddress: this.targetAddress,
          comments: this.comments
        })
      }
    },
    transfer: function () {
      if (!this.targetAddress) {
        this.errorMessage('error_no_address')
        return
      }
      if (!validateAddress(this.crypto, this.targetAddress)) {
        this.errorMessage('error_incorrect_address', { crypto: this.crypto })
        return
      }
      if (!this.targetAmount) {
        this.errorMessage('error_no_amount')
        return
      }
      if (this.targetAmount <= 0) {
        this.errorMessage('error_incorrect_amount')
        return
      }
      if (parseFloat(this.targetAmount) > parseFloat(this.maxToTransfer)) {
        this.errorMessage('error_not_enough')
        return
      }
      if (this.fixedAddress && this.crypto !== Cryptos.ADM && this.$store.state.balance < Fees.NOT_ADM_TRANSFER) {
        this.errorMessage('error_chat_fee', { crypto: this.crypto })
        return
      }
      if (isErc20(this.crypto) && parseFloat(this.commission) > parseFloat(this.$store.state.eth.balance)) {
        this.errorMessage('error_erc20_fee', { fee: this.commissionString })
        return
      }
      this.$refs['confirm_transfer_dialog'].open()
    }
  },
  computed: {
    maxToTransfer: function () {
      const multiplier = Math.pow(10, this.exponent)
      const commission = isErc20(this.crypto) ? 0 : this.commission
      let localAmountToTransfer = (Math.floor((parseFloat(this.balance) - commission) * multiplier) / multiplier).toFixed(this.exponent)
      if (localAmountToTransfer < 0) {
        localAmountToTransfer = 0
      }
      return localAmountToTransfer
    },
    commission () {
      if (this.crypto === Cryptos.ADM) return Fees.ADM_TRANSFER
      return this.$store.getters[`${this.crypto.toLowerCase()}/fee`]
    },
    commissionString () {
      const amount = this.commission
      const crypto = isErc20(this.crypto) ? Cryptos.ETH : this.crypto
      return `${amount} ${crypto}`
    },
    balance () {
      return this.crypto === Cryptos.ADM
        ? this.$store.state.balance
        : this.$store.state[this.crypto.toLowerCase()].balance
    },
    exponent () {
      return CryptoAmountPrecision[this.crypto]
    },
    cryptosList () {
      return Object.keys(Cryptos)
    },
    displayName () {
      return this.$store.getters['partners/displayName'](this.fixedAddress)
    },
    addressLabel () {
      const displayName = this.displayName
      if (displayName) {
        return this.$t('transfer.to_label') + ' ' + displayName
      }

      if (this.fixedCrypto && this.fixedCrypto !== Cryptos.ADM) {
        return this.$t('transfer.to_label') + ' ' + this.fixedAddress
      }

      return this.$t('transfer.to_address_label')
    },
    confirmMessage () {
      let target = this.displayName || this.fixedAddress || this.targetAddress

      if (target !== this.targetAddress) {
        target += ' (' + this.targetAddress + ')'
      }

      const msgType = this.displayName ? 'transfer.confirm_message_with_name' : 'transfer.confirm_message'

      return this.$t(msgType, { amount: this.targetAmount, target, crypto: this.crypto })
    },
    hideTotal () {
      return isErc20(this.crypto)
    }
  },
  mounted () {
    if (!this.fixedCrypto || !this.fixedAddress) return

    this.targetAddress = (this.fixedCrypto === Cryptos.ADM)
      ? this.fixedAddress
      : this.$store.getters['partners/cryptoAddress'](this.fixedAddress, this.fixedCrypto)
  },
  watch: {
    targetAmount (to, from) {
      var fixedPoint = this.exponent
      if (to.toString().indexOf('.') > -1) {
        fixedPoint = to.toString().length - to.toString().indexOf('.') - 1
        if (fixedPoint < this.exponent) {
          fixedPoint = this.exponent
        }
      }
      const commission = (this.crypto === Cryptos.ADM || this.crypto === Cryptos.ETH) ? this.commission : 0
      this.finalAmount = (parseFloat(to) + parseFloat(commission)).toFixed(fixedPoint)
    },
    'language' (to, from) {
      this.$i18n.locale = to
    }
  },
  data () {
    return {
      finalAmount: 0,
      formErrorMessage: '',
      // amountToTransfer: 0,
      targetAddress: '',
      targetAmount: '',
      crypto: this.fixedCrypto || Cryptos.ADM,
      comments: '',
      isWaiting: false,
      showLoader: false
    }
  },
  props: ['fixedCrypto', 'fixedAddress']
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  .address-in-confirm {
    word-break: break-word;
  }
  .md-dialog-container.md-active .md-dialog {
    background: #fefefe;
  }
  .md-input-container.md-has-value input.md-input[readonly] {
    color: rgba(0, 0, 0, 0.54);
  }
  .transfer {
    margin-top: 80px;
  }
  .transfer form {
    max-width: 95%;
    margin: auto;
  }
  .md-toolbar .md-title {
    text-align: left;
  }
  @media (max-width: 800px) {
    .transfer {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    .amount-label {
      font-size: 12px;
    }
  }

  .md-button.send_funds_button {
    margin-top: 20px;
    background-color: #FFFFFF;
  }

  .md-button.send_funds_button:focus {
    background-color: #dfdfdf !important;
  }
</style>
