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
        class="a-chat__message-avatar"
        :class="{ 'a-chat__message-avatar--right': sender.id === userId }"
      >
        <slot name="avatar"></slot>
      </div>
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-body">
          <div v-if="html" v-html="message" class="a-chat__message-text"></div>
          <div v-else v-text="message" class="a-chat__message-text"></div>
        </div>

        <div class="a-chat__message-card-header mt-1">
          <div :title="timeTitle" class="a-chat__timestamp font-italic">{{ time }}</div>
          <div class="a-chat__status">
            <v-icon v-if="status === 'sent'" size="15">mdi-clock-outline</v-icon>
            <v-icon
              v-else-if="status === 'rejected'"
              size="15"
              color="red"
              @click="$emit('resend')"
            >mdi-clock-outline</v-icon>
            <v-icon v-else size="15">mdi-check-all</v-icon>
          </div>
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
      validator: v => ['sent', 'confirmed', 'rejected'].includes(v)
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
    }
  }
}
</script>
