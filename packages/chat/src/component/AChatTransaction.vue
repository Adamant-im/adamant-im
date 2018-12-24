<template>
  <div
    class="a-chat__message"
    :class="{
      'red lighten-5': senderId === userId,
      'green lighten-5': senderId !== userId
    }"
  >
    <div class="a-chat__message-card">
      <div class="a-chat__message-card-header">
        <div v-if="senderId === userId" class="a-chat__sender">
          Sent {{ amountFormatted }} {{ currency }}
        </div>
        <div v-else class="a-chat__sender">
          Received {{ amountFormatted }} {{ currency }}
        </div>
        <v-icon @click="$emit('click:transaction')" class="mr-2">mdi-open-in-new</v-icon>
        <span :title="date" class="a-chat__timestamp">{{ time }}</span>
      </div>

      <div class="a-chat__message-card-body">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  export default {
    computed: {
      time () {
        return moment(this.timestamp).format('hh:mm A')
      },
      date () {
        return moment(this.timestamp).format('LLLL')
      },
      amountFormatted () {
        return (this.amount / 100000000).toFixed(2)
      }
    },
    props: {
      id: {
        type: String,
        required: true,
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
      senderId: {
        type: String,
        default: ''
      },
      amount: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: 'ADM'
      }
    }
  }
</script>
