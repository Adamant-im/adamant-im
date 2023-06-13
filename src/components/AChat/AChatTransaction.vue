<template>
  <div
    :id="`chat__message-container-${id}`"
    class="a-chat__message-container"
    :class="{
      'a-chat__message-container--right': isStringEqualCI(sender.id, userId)
    }"
    @contextmenu="onRightClick($event)"
  >
    <v-icon
      v-if="!isStringEqualCI(sender.id, userId)"
      medium
      class="a-chat__message--reply-to-icon"
    >
      mdi-arrow-left-top
    </v-icon>
    <v-menu
      v-model="isShowReplyToMenu"
      :position-x="x"
      :position-y="y"
      absolute
      offset-y
      class="a-chat__message--menu"
    >
      <v-list
        :id="`chat__message-${id}`"
        class=""
        dense
      >
        <v-list-tile @click="menuReplyTo">
          <v-list-tile-avatar>
            <v-icon>mdi-arrow-left-top</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-title>{{ $t('chats.reply_to') }}</v-list-tile-title>
        </v-list-tile>
        <v-list-tile @click="copyMessage">
          <v-list-tile-avatar>
            <v-icon>mdi-content-copy</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-title>{{ $t('chats.copy_text') }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
    <div
      ref="msg"
      class="a-chat__message-wrapper"
      :class="{ 'a-chat__message-wrapper--selected': isSelected }"
      @touchstart="touchStart"
      @touchmove="doMove($event)"
      @touchend="touchStop($event)"
    >
      <div
        v-if="isReplyToMessage"
        class="a-chat__message--reply-to a-text-regular"
      >
        {{ replyToMessage.text }}
      </div>
      <div
        class="a-chat__message"
        :class="{
          'a-chat__message--highlighted': isStringEqualCI(sender.id, userId),
          'a-chat__message--selected': isSelected
        }"
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
                :icon="statusIcon"
                :color="statusColor"
                :style="statusUpdatable ? 'cursor: pointer;': 'cursor: default;'"
                @click="updateStatus"
              />
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
              <v-row
                align="center"
                no-gutters
              >
                <slot name="crypto" />
                <div class="a-chat__rates-column d-flex ml-4">
                  <span class="mb-1">{{ currencyFormatter(amount, crypto) }}</span>
                  <span class="a-chat__rates">{{ historyRate }}</span>
                </div>
              </v-row>
            </div>
          </div>

          <div class="a-chat__message-card-body">
            <div
              :id="`message-text-${id}`"
              class="a-chat__message-text mb-1 a-text-regular-enlarged"
            >
              {{ message }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tsIcon, tsUpdatable, tsColor, Chat } from '@/lib/constants'
import { isStringEqualCI, trimMsgString } from '@/lib/textHelpers'
import throttle from 'lodash/throttle'
import currencyAmount from '@/filters/currencyAmount'
import { timestampInSec } from '@/filters/helpers'
import currencyFormatter from '@/filters/currencyAmountWithSymbol'

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
    },
    txTimestamp: {
      required: true
    }
  },
  emits: ['mount', 'click:transaction', 'click:transactionStatus'],
  data () {
    return {
      dragging: false,
      isShowReplyToMenu: false,
      startX: 0,
      distance: 0,
      x: 0,
      y: 0,
      replyToMessage: {
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris mi eros, varius non lobortis sit amet, bibendum vel erat. Mauris.'
      },
      isReplyToMessage: false
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
    isOutgoingMessage () {
      return isStringEqualCI(this.sender.id, this.userId)
    },
    replyMsg () {
      const msg =
        document.getElementById(`message-text-${this.id}`).innerText || ''
      return {
        message: `${this.isStringEqualCI(this.sender.id, this.userId) ? '-' : '+'}${this.amount} ${trimMsgString(msg, Chat.MAX_REPLY_CHARS)}`,
        replyto_id: this.id,
        senderId: this.sender.id
      }
    },
    isTouchDevice () {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      )
    },
    isSelected () {
      return this.isShowReplyToMenu
    },
    historyRate () {
      const amount = currencyAmount(this.amount, this.crypto)
      return '~' + this.$store.getters['rate/historyRate'](timestampInSec(this.crypto, this.txTimestamp), amount, this.crypto)
    }
  },
  watch: {
    isSelected (newVal) {
      if (!newVal) {
        if (window.getSelection) {
          window.getSelection().removeAllRanges()
        } else if (document.selection) {
          document.selection.empty()
        }
      }
    },
    txTimestamp () {
      this.getHistoryRates()
    }
  },
  destroyed: function () {
    window.removeEventListener('click', this.bindSelection)
  },
  mounted () {
    document.addEventListener('selectionchange', this.bindSelection)
    this.$emit('mount')
    this.getHistoryRates()
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
    touchStart (event) {
      this.dragging = true
      this.startX = event.clientX
        ? event.clientX
        : event.changedTouches[0].clientX
          ? event.changedTouches[0].clientX
          : 0
    },
    doMove (event) {
      const clientX = event.clientX
        ? event.clientX
        : event.changedTouches[0].clientX
          ? event.changedTouches[0].clientX
          : 0
      if (this.dragging) {
        this.distance = clientX - this.startX
        this.$refs.msg.setAttribute(
          'style',
          `transform: translateX(${this.distance}px)`
        )
      }
    },
    touchStop () {
      this.$refs.msg.setAttribute('style', 'transform: translateX(0px)')
      this.dragging = false
      if (this.distance > 50) {
        this.$emit('replyTo', this.replyMsg)
        this.distance = 0
      }
    },
    onRightClick (event) {
      event.preventDefault()
      this.isTextSelected = !!this.selectedText
      this.isShowReplyToMenu = false
      this.x = event.clientX
      this.y = event.clientY
      this.$nextTick(() => {
        this.isShowReplyToMenu = true
      })
    },
    copySelection () {
      if (navigator.clipboard) navigator.clipboard.writeText(this.selectedText)
      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      } else if (document.selection) {
        document.selection.empty()
      }
    },
    copyMessage () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(
          document.getElementById(`message-text-${this.id}`).innerText || ''
        )
      }
    },
    menuReplyTo () {
      this.$emit('replyTo', this.replyMsg)
      // this.closeReplyToDialog()
      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      } else if (document.selection) {
        document.selection.empty()
      }
    },
    bindSelection () {
      return throttle(() => {
        this.selectedText = document.getSelection().toString()
      }, 100)
    },
    vibrate () {
      if (window && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100)
      }
    },
    getHistoryRates () {
      this.$store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(this.crypto, this.txTimestamp)
      })
    },
    currencyFormatter
  }
}
</script>
