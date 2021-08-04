<template>
  <div class="a-chat">
    <div class="a-chat__content">
      <slot name="header" />

      <v-divider />

      <div class="a-chat__body">
        <div class="text-xs-center py-2">
          <v-progress-circular
            v-show="loading"
            indeterminate
            color="primary"
            size="24"
            style="z-index: 100"
          />
        </div>

        <div
          ref="messages"
          class="a-chat__body-messages"
        >
          <slot
            name="messages"
            :messages="messages"
          >
            <template v-for="message in messages">
              <slot
                name="message"
                :message="message"
                :sender="getSenderMeta(message.senderId)"
                :user-id="userId"
                :locale="locale"
              />
            </template>
          </slot>
        </div>

        <div class="a-chat__fab">
          <slot name="fab" />
        </div>
      </div>

      <slot name="form" />
    </div>
  </div>
</template>

<script>
import throttle from 'lodash/throttle'

import AChatMessage from './AChatMessage'
import AChatTransaction from './AChatTransaction'
import { isStringEqualCI } from '@/lib/textHelpers'

const emitScroll = throttle(function () {
  this.$emit('scroll', this.currentScrollTop, this.isScrolledToBottom())
}, 200)

export default {
  components: {
    AChatMessage,
    AChatTransaction
  },
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    partners: {
      type: Array,
      default: () => []
    },
    userId: {
      type: String
    },
    loading: {
      type: Boolean,
      default: false
    },
    locale: {
      type: String,
      default: 'en'
    }
  },
  data: () => ({
    currentScrollHeight: 0,
    currentScrollTop: 0
  }),
  mounted () {
    this.attachScrollListener()
  },
  beforeDestroy () {
    this.destroyScrollListener()
  },
  methods: {
    attachScrollListener () {
      this.$refs.messages.addEventListener('scroll', this.onScroll)
    },

    destroyScrollListener () {
      this.$refs.messages.removeEventListener('scroll', this.onScroll)
    },

    onScroll () {
      const scrollHeight = this.$refs.messages.scrollHeight
      const scrollTop = this.$refs.messages.scrollTop
      const clientHeight = this.$refs.messages.clientHeight

      // Scrolled to Bottom
      if (scrollHeight - scrollTop === clientHeight) {
        this.$emit('scroll:bottom')
      } else if (scrollTop === 0) { // Scrolled to Top
        // Save current `scrollHeight` to maintain scroll
        // position when unshift new messages
        this.currentScrollHeight = scrollHeight
        this.$emit('scroll:top')
      }

      // Save currentScrollTop.
      // Used when scrolled bottom while loading messages.
      this.currentScrollTop = this.$refs.messages.scrollTop

      emitScroll.call(this)
    },

    // Fix scroll position after unshift new messages.
    // Called from parent component.
    maintainScrollPosition () {
      this.$refs.messages.scrollTop =
        this.$refs.messages.scrollHeight - this.currentScrollHeight + this.currentScrollTop
    },

    // Scroll to Bottom when new message.
    // Called from parent component.
    scrollToBottom () {
      this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight
    },

    scrollTo (position) {
      this.$refs.messages.scrollTop = position
    },

    /**
     * Scroll to message by index, starting with the last.
     */
    scrollToMessage (index) {
      const elements = this.$refs.messages.children

      if (!elements) return

      const element = elements[elements.length - 1 - index]

      if (element) {
        this.$refs.messages.scrollTop = element.offsetTop - 16
      } else {
        this.scrollToBottom()
      }
    },

    isScrolledToBottom () {
      const scrollOffset = (
        this.$refs.messages.scrollHeight - this.$refs.messages.scrollTop - this.$refs.messages.clientHeight
      )

      return scrollOffset <= 60
    },

    /**
     * Returns sender address and name.
     * @param {string} senderId Sender address
     * @returns {{ id: string, name: string }}
     */
    getSenderMeta (senderId) {
      return this.partners.find(partner => isStringEqualCI(partner.id, senderId))
    }
  }
}
</script>
