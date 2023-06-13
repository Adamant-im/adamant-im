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
        <v-list-tile
          v-if="isTextSelected"
          @click="copySelection"
        >
          <v-list-tile-avatar>
            <v-icon>mdi-selection-multiple</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-title>
            {{
              $t('chats.copy_selection')
            }}
          </v-list-tile-title>
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
        <div
          v-if="showAvatar"
          class="a-chat__message-avatar hidden-xs-only"
          :class="{
            'a-chat__message-avatar--right': isStringEqualCI(sender.id, userId)
          }"
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
                :icon="statusIcon"
              />
              <v-icon
                v-else
                size="13"
                :icon="statusIcon"
              />
            </div>
          </div>
          <div class="a-chat__message-card-body">
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
              :id="`message-text-${id}`"
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
import throttle from 'lodash/throttle'

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
  emits: ['resend'],
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
      isReplyToMessage: false,
      isTextSelected: false,
      selectedText: ''
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
      const msg =
        document.getElementById(`message-text-${this.id}`).innerText || ''
      return {
        message: trimMsgString(msg, Chat.MAX_REPLY_CHARS),
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
    }
  },
  mounted () {
    document.addEventListener('selectionchange', this.bindSelection)
  },
  destroyed: function () {
    window.removeEventListener('click', this.bindSelection)
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
    }
  }
}
</script>
