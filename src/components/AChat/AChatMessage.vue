<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': isStringEqualCI(sender.id, userId) }"
  >
    <v-icon
      v-if="!isStringEqualCI(sender.id, userId)"
      medium
      class="a-chat__message--reply-to-icon"
    >
      mdi-arrow-left-top
    </v-icon>

    <div
      ref="msg"
      class="a-chat__message-wrapper"
      :class="{ 'a-chat__message-wrapper--selected': selected }"
      @contextmenu="onRightClick($event)"
      @touchstart="touchStart"
      @touchmove="doMove($event)"
      @touchend="touchStop($event)"
    >
      <v-list
        v-if="!isStringEqualCI(sender.id, userId) && isShowReplyToMenu"
        :id="`reply-dialog-${id}`"
        class="a-chat__message--reply-to-menu"
        :style="`left:${x}px;top:${y}px`"
      >
        <v-list-tile
          @click="menuReplyTo"
        >
          <v-list-tile-avatar>
            <v-icon>mdi-arrow-left-top</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-title>{{ $t('chats.reply_to') }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
      <div
        v-if="isReplyToMessage"
        class="a-chat__message--reply-to a-text-regular"
      >
        {{ replyToMessage.text }}
      </div>
      <div
        class="a-chat__message"
        :class="{ 'a-chat__message--highlighted': isStringEqualCI(sender.id, userId), 'a-chat__message--selected': selected }"
      >
        <div
          v-if="showAvatar"
          class="a-chat__message-avatar hidden-xs-only"
          :class="{ 'a-chat__message-avatar--right': isStringEqualCI(sender.id, userId) }"
        >
          <slot name="avatar" />
        </div>
        <div class="a-chat__message-card">
          <div
            v-if="!hideTime"
            class="a-chat__message-card-header mt-1"
          >
            <div
              v-if="status.status === 'CONFIRMED'"
              class="a-chat__blockchain-status"
            >
              &#x26AD;
            </div>
            <div
              :title="timeTitle"
              class="a-chat__timestamp"
            >
              {{ time }}
            </div>
            <div
              v-if="isOutgoingMessage"
              class="a-chat__status"
            >
              <v-icon
                v-if="status.status === 'REJECTED'"
                :title="i18n.retry"
                size="15"
                color="red"
                @click="$emit('resend')"
              >
                {{ statusIcon }}
              </v-icon>
              <v-icon
                v-else
                size="13"
              >
                {{ statusIcon }}
              </v-icon>
            </div>
          </div>
          <div
            class="a-chat__message-card-body"
          >
            <!-- eslint-disable vue/no-v-html -- Safe with DOMPurify.sanitize() content -->
            <!-- AChatMessage :message <- Chat.vue :message="formatMessage(message)" <- formatMessage <- DOMPurify.sanitize() -->
            <div
              v-if="html"
              :id="`message-text-${id}`"
              class="a-chat__message-text a-text-regular-enlarged"
              v-html="message"
            />
            <!-- eslint-enable vue/no-v-html -->
            <div
              v-else
              class="a-chat__message-text a-text-regular-enlarged"
              v-text="message"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { isStringEqualCI, trimMsgString } from '@/lib/textHelpers'
import { tsIcon, Chat } from '@/lib/constants'

export default {
  props: {
    id: {
      type: null,
      required: true
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
    status: {
      type: Object,
      required: true
    },
    userId: {
      type: String,
      default: ''
    },
    sender: {
      type: Object,
      required: true
    },
    showAvatar: {
      type: Boolean,
      default: true
    },
    locale: {
      type: String,
      default: 'en'
    },
    html: {
      type: Boolean,
      default: false
    },
    i18n: {
      type: Object,
      default: () => ({
        retry: 'Message did not sent, weak connection. Click to retry'
      })
    },
    hideTime: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      dragging: false,
      touchDuration: 500,
      touchTimer: null,
      isShowReplyToMenu: false,
      startX: 0,
      distance: 0,
      x: 0,
      y: 0,
      selected: false,
      replyToMessage: {
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris mi eros, varius non lobortis sit amet, bibendum vel erat. Mauris.'
      },
      isReplyToMessage: false
    }
  },
  computed: {
    statusIcon () {
      return tsIcon(this.status.virtualStatus)
    },
    isOutgoingMessage () {
      return isStringEqualCI(this.sender.id, this.userId)
    },
    replyMsg () {
      const msg = document.getElementById(`message-text-${this.id}`).innerText || ''
      return {
        message: trimMsgString(msg, Chat.MAX_REPLY_CHARS),
        replyto_id: this.id
      }
    },
    isTouchDevice () {
      return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0))
    }
  },
  destroyed: function () {
    window.removeEventListener('click', this.replyToBtnHandler)
  },
  methods: {
    // /**
    //  * Registered ADM transactions must be shown as confirmed, as they are socket-enabled
    //  * @returns {string}
    //  */
    // virtualStatus () {
    //   if (this.status === TS.REGISTERED) return TS.CONFIRMED
    //   return this.status
    // },
    isStringEqualCI (string1, string2) {
      return isStringEqualCI(string1, string2)
    },
    touchStart (event) {
      if (!this.isStringEqualCI(this.sender.id, this.userId)) {
        // this.x = event.changedTouches && event.changedTouches[0].clientX ? event.changedTouches[0].clientX : 0
        // this.y = event.changedTouches && event.changedTouches[0].clientY ? event.changedTouches[0].clientY - 64 : 0 // 64 - height of appbar
        // this.touchTimer = setTimeout(this.onLongTouch, this.touchDuration)
        this.dragging = true
        this.startX = event.clientX ? event.clientX : event.changedTouches[0].clientX ? event.changedTouches[0].clientX : 0
      }
    },
    doMove (event) {
      if (!this.isStringEqualCI(this.sender.id, this.userId)) {
        const clientX = event.clientX ? event.clientX : event.changedTouches[0].clientX ? event.changedTouches[0].clientX : 0
        if (this.dragging) {
          this.distance = clientX - this.startX < 0 ? 0 : clientX - this.startX > 79 ? 80 : 0
          this.$refs.msg.setAttribute('style', `transform: translateX(${this.distance}px)`)
        }
      }
    },
    touchStop () {
      if (!this.isStringEqualCI(this.sender.id, this.userId)) {
        this.$refs.msg.setAttribute('style', 'transform: translateX(0px)')
        this.dragging = false
        // if (this.touchTimer) {
        //   clearTimeout(this.touchTimer)
        // }
        if (this.distance > 50) {
          this.$emit('replyTo', this.replyMsg)
          this.vibrate()
        }
      }
    },
    // onLongTouch () {
    //   if (!this.isStringEqualCI(this.sender.id, this.userId)) {
    //     this.isShowReplyToMenu = true
    //     this.selected = true
    //     this.replyToBtnAddListener()
    //     this.vibrate()
    //   }
    // },
    onRightClick (event) {
      if (!this.isTouchDevice) {
        event.preventDefault()
      }
      if (!this.isStringEqualCI(this.sender.id, this.userId)) {
        if (!this.isShowReplyToMenu) {
          // this.x = event.offsetX ? event.offsetX : 0
          // this.y = event.offsetY ? event.offsetY : 0
          this.x = event.offsetX ? event.offsetX + event.target.offsetLeft : 0
          this.y = event.offsetY ? event.offsetY + event.target.offsetTop : 0
        }
        this.isShowReplyToMenu = true
        this.selected = true
        this.replyToBtnAddListener()
        this.vibrate()
      }
    },
    replyToBtnAddListener () {
      window.addEventListener('click', this.replyToBtnHandler)
    },
    menuReplyTo () {
      this.$emit('replyTo', this.replyMsg)
      this.closeReplyToDialog()
      if (window.getSelection) { window.getSelection().removeAllRanges() } else if (document.selection) { document.selection.empty() }
    },
    replyToBtnHandler (e) {
      if (!document.getElementById(`reply-dialog-${this.id}`).contains(e.target)) {
        this.closeReplyToDialog()
      }
    },
    closeReplyToDialog () {
      window.removeEventListener('click', this.replyToBtnHandler)
      this.isShowReplyToMenu = false
      this.selected = false
    },
    vibrate () {
      if (window && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100)
      }
    }
  }
}
</script>
