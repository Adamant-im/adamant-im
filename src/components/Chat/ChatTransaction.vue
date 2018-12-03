<template>
  <div class="chat__item chat__item--transfer" :class="{ 'chat__item--right': senderId === userId }">
    <div class="chat__item-header">
      <span v-if="senderId !== userId">{{ senderId }}</span>
      <span :title="dateTime">{{ timeAgo }}</span>
    </div>

    <div class="chat__item-body">
      <span v-if="senderId === userId">You've sent {{ amount }} {{ currency }}</span>
      <span v-else>You received {{ amount }} {{ currency }}</span>
      <v-icon class="ml-2">mdi-file-document</v-icon>
      <div v-if="message" class="body-1 mt-2">{{ message }}</div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    timeAgo () {
      return this.$formatDate(this.timestamp)
    },
    dateTime () {
      // @todo use `moment` or add these prototype methods to Vue:
      // $timeAgo & $dateTime
      return ''
    }
  },
  props: ['message', 'userId', 'senderId', 'timestamp', 'amount', 'currency']
}
</script>
