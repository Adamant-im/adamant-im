<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': isStringEqualCI(sender.id, userId) }"
  >
    <div
      class="a-chat__message"
      :class="{ 'a-chat__message--highlighted': isStringEqualCI(sender.id, userId) }"
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
        <div class="a-chat__message-card-body">
          <!-- eslint-disable vue/no-v-html -- Safe with DOMPurify.sanitize() content -->
          <!-- AChatMessage :message <- Chat.vue :message="formatMessage(message)" <- formatMessage <- DOMPurify.sanitize() -->
          <div
            v-if="html"
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
</template>

<script>
import { isStringEqualCI } from '@/lib/textHelpers'
import { tsIcon } from '@/lib/constants'

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
  computed: {
    statusIcon () {
      return tsIcon(this.status.virtualStatus)
    },
    isOutgoingMessage () {
      return isStringEqualCI(this.sender.id, this.userId)
    }
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
    }
  }
}
</script>
