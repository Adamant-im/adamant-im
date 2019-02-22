<template>
  <div class="a-chat__form">
    <v-divider v-if="showDivider" class="a-chat__divider"/>
    <v-textarea
      v-model="message"
      v-on="listeners"
      :label="label"
      hide-details
      single-line
      auto-grow
      ref="messageTextarea"
      rows="1"

      :append-icon="showSendButton ? 'mdi-send' : ''"
      @click:append="submitMessage"
    >
      <template slot="prepend">
        <slot name="prepend"></slot>
      </template>
    </v-textarea>
  </div>
</template>

<script>
export default {
  computed: {
    /**
     * Processing `ctrl+enter`, `shift + enter` and `enter`
     */
    listeners () {
      return {
        keydown: (e) => {
          if (e.code === 'Enter') {
            if (this.sendOnEnter) {
              if (e.ctrlKey) { // add LF and calculate height when CTRL+ENTER
                this.addLineFeed()
                this.calculateInputHeight()
                return
              }

              if (!e.shiftKey) { // send message if shiftKey is not pressed
                e.preventDefault()
                this.submitMessage()
              }
            } else {
              if (e.ctrlKey || e.shiftKey) {
                e.preventDefault()
                this.submitMessage()
              }
            }
          }
        }
      }
    }
  },
  data: () => ({
    message: ''
  }),
  methods: {
    submitMessage () {
      this.$emit('message', this.message)
      this.message = ''
      // Fix textarea height to 1 row after miltiline message send
      this.calculateInputHeight()
    },
    calculateInputHeight () {
      this.$nextTick(this.$refs.messageTextarea.calculateInputHeight)
    },
    addLineFeed () {
      this.message += '\n'
    }
  },
  props: {
    showSendButton: {
      type: Boolean,
      default: true
    },
    sendOnEnter: {
      type: Boolean,
      default: true
    },
    label: {
      type: String,
      default: 'Type your message'
    },
    showDivider: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="stylus" scoped>
/**
 * Remove extra margins & paddings.
 */
.v-chat__form >>> .v-text-field
  padding-top: 0
  margin-top: 0

.a-chat__divider
  position: absolute
  top: 0
  left: 0
  width: 100%
</style>
