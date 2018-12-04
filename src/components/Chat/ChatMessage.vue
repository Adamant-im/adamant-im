<template>
  <div
    class="chat__item"
    :class="{ 'chat__item--right': senderId === userId }"
  >
    <div class="chat__item-header">
      <span v-if="senderId !== userId">{{ senderId }}</span>
      <span v-if="!readonly" :title="dateTime">{{ timeAgo }}</span>
    </div>

    <div class="chat__item-body" v-markdown="message"></div>
  </div>
</template>

<script>
import markdown from '@/directives/markdown'

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
  directives: {
    markdown
  },
  props: ['userId', 'senderId', 'message', 'timestamp', 'readonly']
}
</script>
