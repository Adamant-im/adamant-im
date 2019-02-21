<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': sender.id === userId }"
  >
    <div
      class="a-chat__message"
      :class="{
        'a-chat__message--red': sender.id === userId,
        'a-chat__message--green': sender.id !== userId
      }"
    >
      <div class="a-chat__message-card">
        <div>
          <div>
            {{ sender.id === userId ? i18n.sent : i18n.received }}
          </div>
          <div @click="$emit('click:transaction', id)" class="a-chat__amount my-1">
            {{ amount }}
          </div>
        </div>

        <div class="a-chat__message-card-body">
          <div class="a-chat__message-text font-italic mb-1">
            {{ message }}
          </div>
        </div>

        <div class="a-chat__message-card-header">
          <div :title="timeTitle" class="a-chat__timestamp font-italic">{{ time }}</div>
          <div class="a-chat__status">
            <v-icon size="15">{{ statusIcon }}</v-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  mounted () {
    this.$emit('mount')
  },
  computed: {
    statusIcon () {
      if (this.status === 'delivered') {
        return 'mdi-check'
      } else if (this.status === 'pending') {
        return 'mdi-clock-outline'
      } else if (this.status === 'rejected') {
        return 'mdi-close-circle-outline'
      } else {
        return 'mdi-alert-outline'
      }
    }
  },
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
    userId: {
      type: String,
      default: ''
    },
    sender: {
      type: Object,
      required: true
    },
    amount: {
      type: [Number, String],
      default: 0
    },
    currency: {
      type: String,
      default: 'ADM'
    },
    i18n: {
      type: Object,
      default: () => ({
        'sent': 'Sent',
        'received': 'Received'
      })
    },
    locale: {
      type: String,
      default: 'en'
    },
    status: {
      type: String,
      default: 'confirmed',
      validator: v => ['delivered', 'pending', 'rejected', 'invalid'].includes(v)
    }
  }
}
</script>
