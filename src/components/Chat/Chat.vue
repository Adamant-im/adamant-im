<template>
  <div class="chat">

    <div class="chat__body" ref="chat">

      <slot></slot>

    </div>

  </div>
</template>

<script>
import '@/assets/css/components/_chat.css'

export default {
  updated () {
    this.scrollToBottom()
  },
  methods: {
    scrollToBottom () {
      this.$refs.chat.scrollTop = this.$refs.chat.scrollHeight
    }
  }
}
</script>
