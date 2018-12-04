<template>
  <div
    class="chat__item"
    :class="{ 'chat__item--right': senderId === userId }"
  >
    <div class="chat__item-header">
      <span v-if="senderId !== userId">{{ senderId }}</span>
      <span v-if="!readonly" :title="dateTime">{{ timeAgo }}</span>
    </div>

    <div class="chat__item-body">
      {{ message }}
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
  props: ['userId', 'senderId', 'message', 'timestamp', 'readonly']
}
</script>
