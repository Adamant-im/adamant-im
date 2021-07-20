<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': sender.id === userId }"
  >
    <div
      class="a-chat__message"
      :class="{ 'a-chat__message--highlighted': sender.id === userId }"
    >
      <div
        v-if="showAvatar"
        class="a-chat__message-avatar hidden-xs-only"
        :class="{ 'a-chat__message-avatar--right': sender.id === userId }"
      >
        <slot name="avatar" />
      </div>
      <div class="a-chat__message-card">
        <div
          v-if="!hideTime"
          class="a-chat__message-card-header mt-1"
        >
          <div
            v-if="status === 'confirmed'"
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
              v-if="status === 'rejected'"
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
          <div
            v-if="html"
            class="a-chat__message-text a-text-regular-enlarged"
            v-html="message"
          />
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
      type: String,
      default: 'confirmed',
      validator: v => ['confirmed', 'delivered', 'pending', 'rejected'].includes(v)
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
      if (this.status === 'confirmed' || this.status === 'delivered') {
        return 'mdi-check'
      } else if (this.status === 'pending') {
        return 'mdi-clock-outline'
      } else {
        return 'mdi-close-circle-outline'
      }
    },
    isOutgoingMessage () {
      return this.sender.id === this.userId
    }
  }
}
</script>
