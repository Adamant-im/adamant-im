<template>
  <div class="a-chat__form">
    <v-textarea
      v-model="message"
      v-on="listeners"
      :label="label"
      hide-details
      single-line
      no-resize
      rows="1"

      :append-outer-icon="showSendButton ? 'mdi-send' : ''"
      @click:append-outer="submitMessage"
    />
  </div>
</template>

<script>
export default {
  computed: {
    /**
     * Processing `shift + enter` and `enter`
     */
    listeners () {
      return {
        keydown: (e) => {
          if (e.code === 'Enter' && !e.shiftKey) {
            if (this.sendOnEnter) {
              e.preventDefault()
              this.submitMessage()
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
    }
  },
  props: {
    showSendButton: {
      type: Boolean,
      default: false
    },
    sendOnEnter: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: 'Type your message'
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
</style>
