<template>
  <div
    class="chat__item"
    :class="{ 'chat__item--right': senderId === userId }"
  >
    <div class="chat__item-header">
      <span v-if="senderId !== userId">{{ senderId }}</span>
      <span :title="dateTime">{{ timeAgo }}</span>
    </div>

    <div class="chat__item-body">
      {{ message }}
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  computed: {
    timeAgo () {
      return moment(this.timestamp).startOf('hour').fromNow()
    },
    dateTime () {
      return moment(this.timestamp)
    }
  },
  props: ['userId', 'senderId', 'message', 'timestamp']
}
</script>
