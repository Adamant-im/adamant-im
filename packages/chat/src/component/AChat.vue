<template>
  <div class="a-chat">
    <div class="a-chat__content">

      <slot name="header"></slot>

      <v-divider/>

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

        <div ref="messages" class="a-chat__body-messages">
          <slot name="messages" :messages="filledMessages">

              <template v-for="message in filledMessages">

                <slot name="message"
                  :message="message"
                  :sender="message.sender"
                  :user-id="userId"
                />

              </template>

          </slot>
        </div>

      </div>

      <v-divider/>

      <slot name="form"></slot>
    </div>
  </div>
</template>

<script>
import AChatMessage from './AChatMessage'
import AChatTransaction from './AChatTransaction'
export default {
  mounted () {
    this.attachScrollListener()
  },
  beforeDestroy () {
    this.destroyScrollListener()
  },
  computed: {
    /**
     * Add sender info for each message.
     * `message.sender` is a reference to `this.partners`
     */
    filledMessages () {
      return this.messages.map(message => {
        message.sender = this.partners.find(partner => partner.id === message.senderId)

        return message
      })
    }
  },
  data: () => ({
    currentScrollHeight: 0,
    currentScrollTop: 0
  }),
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
    }
  },
  components: {
    AChatMessage,
    AChatTransaction
  },
  props: {
    messages: {
      type: Array
    },
    partners: {
      type: Array
    },
    userId: {
      type: String
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
}
</script>
