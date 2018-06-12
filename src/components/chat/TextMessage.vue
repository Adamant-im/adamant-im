<template>
  <chat-entry-template
    :confirm="message.confirm_class"
    :direction="message.direction"
    :timestamp="message.timestamp"
    :brief="brief"
  >
    <span v-html="message.message"></span>

    <template slot="brief-view">
      <span v-html="message.message"></span>
    </template>
  </chat-entry-template>
</template>

<script>
  import ChatEntryTemplate from './ChatEntryTemplate.vue'

  export default {
    name: 'text-message',
    components: { ChatEntryTemplate },
    props: ['message', 'brief']
  }
</script>
