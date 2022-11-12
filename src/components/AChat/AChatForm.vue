<template>
  <div :class="classes">
    <v-divider
      v-if="showDivider"
      class="a-chat__divider"
    />
    <v-textarea
      ref="messageTextarea"
      v-model="message"
      :placeholder="label"
      hide-details
      single-line
      auto-grow
      rows="1"
      v-on="listeners"
    >
      <template
        v-if="showSendButton"
        slot="append"
      >
        <v-icon size="28">
          mdi-send
        </v-icon>
      </template>
      <template slot="prepend">
        <slot name="prepend" />
      </template>
    </v-textarea>

    <div
      v-if="showSendButton"
      class="a-chat__form-send-area"
      @click="submitMessage"
    />
  </div>
</template>

<script>
import { nextTick } from 'vue'

export default {
  props: {
    messageText: {
      default: '',
      type: String
    },
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
      default: 'Type a message'
    },
    showDivider: {
      type: Boolean,
      default: false
    }
  },
  emits: ['message'],
  data: () => ({
    message: ''
  }),
  computed: {
    className: () => 'a-chat',
    classes () {
      return [
        `${this.className}__form`,
        {
          [`${this.className}__form--is-active`]: !!this.message
        }
      ]
    },
    /**
     * Processing `ctrl+enter`, `shift + enter` and `enter`
     */
    listeners () {
      return {
        keypress: (e) => {
          // on some devices keyCode for CTRL+ENTER is 10
          // https://bugs.chromium.org/p/chromium/issues/detail?id=79407
          if (e.keyCode === 13 || e.keyCode === 10) { // Enter || Ctrl+Enter
            if (this.sendOnEnter) {
              // add LF and calculate height when CTRL+ENTER or ALT+ENTER or CMD+ENTER (Mac & Windows)
              // no need to add LF for shiftKey, it will be added automatically
              if (e.ctrlKey || e.altKey || e.metaKey) {
                this.addLineFeed()
                this.calculateInputHeight()
                return
              }

              if (!e.shiftKey) { // send message if shiftKey is not pressed
                e.preventDefault()
                this.submitMessage()
              }
            } else {
              if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
                e.preventDefault()
                this.submitMessage()
              }
            }
          }
        }
      }
    }
  },
  mounted () {
    if (this.messageText) {
      this.message = this.messageText
      this.focus()
    }
  },
  methods: {
    submitMessage () {
      this.$emit('message', this.message)
      this.message = ''
      // Fix textarea height to 1 row after miltiline message send
      this.calculateInputHeight()
      this.focus()
    },
    calculateInputHeight () {
      nextTick(this.$refs.messageTextarea.calculateInputHeight)
    },
    addLineFeed () {
      this.message += '\n'
    },
    focus () {
      this.$refs.messageTextarea.focus()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~vuetify/settings';
@import '../../assets/styles/settings/_colors.scss';

/**
 * 1. Limit height of message form.
 * 2. Align icons at the bottom.
 */
.a-chat__form {
  :deep(.v-text-field__slot) textarea  {
    max-height: 230px;
    overflow-y: auto;
  }
  :deep(.v-text-field)  {
    align-items: flex-end;
  }
  :deep(.v-textarea)  {
    .v-input__prepend-outer {
      margin-bottom: 2px;
    }
    .v-input__append-inner {
      margin-top: auto;
      margin-bottom: 4px;
    }
    .v-input__control {
      margin-bottom: 2px;
    }
  }
}

.a-chat__divider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.a-chat__form-send-area {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50px;
  height: 50px;
  cursor: pointer;
}

.theme--light {
  :deep(.v-text-field__slot) {
    textarea {
      &::placeholder {
        color: map-get($adm-colors, 'muted');
      }
    }
  }
}

.theme--dark {
  :deep(.v-text-field__slot) {
    textarea {
      &::placeholder {
        color: rgba(map-get($shades, 'white'), 70%);
      }
    }
  }
}
</style>
