<template>
  <div :class="classes">
    <v-divider v-if="showDivider" class="a-chat__divider" />

    <slot name="reply-preview" />

    <v-textarea
      ref="messageTextarea"
      v-model="message"
      :placeholder="label"
      hide-details
      single-line
      auto-grow
      rows="1"
      max-rows="10"
      variant="underlined"
      density="compact"
      color="primary"
      v-on="listeners"
    >
      <template v-if="showSendButton" #append-inner>
        <v-icon class="a-chat__send-icon" icon="mdi-send" size="28" />
      </template>
      <template #prepend>
        <slot name="prepend" />
      </template>
    </v-textarea>

    <div v-if="showSendButton" class="a-chat__form-send-area" @click="submitMessage" />
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
    },
    clearInputValueOnSend: {
      type: Boolean,
      default: true
    }
  },
  emits: ['message', 'esc'],
  data: () => ({
    message: ''
  }),
  computed: {
    className: () => 'a-chat',
    classes() {
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
    listeners() {
      return {
        keypress: (e) => {
          // on some devices keyCode for CTRL+ENTER is 10
          // https://bugs.chromium.org/p/chromium/issues/detail?id=79407
          if (e.keyCode === 13 || e.keyCode === 10) {
            // Enter || Ctrl+Enter
            if (this.sendOnEnter) {
              // add LF and calculate height when CTRL+ENTER or ALT+ENTER or CMD+ENTER (Mac & Windows)
              // no need to add LF for shiftKey, it will be added automatically
              if (e.ctrlKey || e.altKey || e.metaKey) {
                this.addLineFeed()
                this.calculateInputHeight()
                return
              }

              if (!e.shiftKey) {
                // send message if shiftKey is not pressed
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
        },
        keydown: (e) => {
          if (e.code === 'Escape') {
            this.$emit('esc')
          }
        }
      }
    }
  },
  mounted() {
    if (this.messageText) {
      this.message = this.messageText
      this.focus()
    }
  },
  methods: {
    submitMessage() {
      this.$emit('message', this.message)
      if (this.clearInputValueOnSend) {
        this.message = ''
      }
      // Fix textarea height to 1 row after miltiline message send
      this.calculateInputHeight()
      this.focus()
    },
    calculateInputHeight() {
      nextTick(this.$refs.messageTextarea.calculateInputHeight)
    },
    addLineFeed() {
      this.message += '\n'
    },
    focus() {
      this.$refs.messageTextarea.focus()
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
@import '../../assets/styles/settings/_colors.scss';

/**
 * 1. Limit height of message form.
 * 2. Align icons at the bottom.
 */
.a-chat__form {
  :deep(.v-text-field__slot) textarea {
    max-height: 230px;
    overflow-y: auto;
  }
  :deep(.v-text-field) {
    align-items: flex-end;
  }
  :deep(.v-textarea) {
    .v-input__prepend {
      margin-bottom: 2px;
      margin-inline-end: 9px;
      padding-top: 0;
    }
    .v-field__append-inner {
      margin-top: auto;
      padding-top: 0;
      margin-bottom: 4px;
    }
    .v-field__prepend-inner > .v-icon,
    .v-field__append-inner > .v-icon,
    .v-field__clearable > .v-icon {
      --v-medium-emphasis-opacity: 1;
    }
    .v-input__control {
      margin-bottom: 2px;
    }
    .v-field__input {
      &::placeholder {
        --v-disabled-opacity: 1;
      }
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

.v-theme--light {
  .a-chat__form {
    :deep(.v-textarea) {
      .v-field__input {
        caret-color: map-get($adm-colors, 'primary');

        &::placeholder {
          color: map-get($adm-colors, 'muted');
        }
      }
    }
  }
}

.v-theme--dark {
  .a-chat__form {
    :deep(.v-textarea) {
      .v-field__input {
        caret-color: map-get($adm-colors, 'primary');

        &::placeholder {
          color: rgba(map-get($shades, 'white'), 70%);
        }
      }
    }
  }
}
</style>
