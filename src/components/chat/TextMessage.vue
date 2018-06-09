<template>
  <chat-entry-template
    :confirm="message.confirm_class"
    :direction="message.direction"
    :timestamp="message.timestamp"
  >
    <span v-html="message.message"></span>
  </chat-entry-template>
</template>

<script>
  import ChatEntryTemplate from './ChatEntryTemplate.vue'

  export default {
    name: 'text-message',
    components: { ChatEntryTemplate },
    props: ['message']
  }
</script>
