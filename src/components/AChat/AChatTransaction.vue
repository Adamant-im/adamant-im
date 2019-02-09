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
        <div class="a-chat__message-card-header">
          <div v-if="sender.id === userId" class="a-chat__sender">
            {{ i18n.sent }} {{ amount }} {{ currency }}
          </div>
          <div v-else class="a-chat__sender">
            {{ i18n.received }} {{ amount }} {{ currency }}
          </div>
          <v-icon @click="$emit('click:transaction', id)" class="mr-2">mdi-open-in-new</v-icon>
          <span :title="date" class="a-chat__timestamp">{{ time }}</span>
          <div class="a-chat__status">
            <v-icon
              size="15"
              :color="status === 'rejected' ? 'red' : ''"
            >{{ statusIcon }}</v-icon>
          </div>
        </div>

        <div class="a-chat__message-card-body">
          <div class="a-chat__message-text">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  mounted () {
    this.$emit('mount')
  },
  computed: {
    time () {
      return moment(this.timestamp).format('hh:mm A')
    },
    date () {
      return moment(this.timestamp).format('LLLL')
    },
    statusIcon () {
      if (this.status === 'sent') {
        return 'mdi-clock-outline'
      } else if (this.status === 'rejected') {
        return 'mdi-clock-outline'
      } else {
        return 'mdi-check-all'
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
    timestamp: {
      type: Number,
      default: 0
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
      validator: v => ['sent', 'confirmed', 'rejected'].includes(v)
    }
  }
}
</script>
