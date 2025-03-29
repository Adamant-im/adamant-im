<template>
  <component v-if="currentComponent" :is="currentComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Chats from '@/components/Chat/Chats.vue'
import Home from '@/views/Home.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentComponent = computed(() => {
  if (route.name === 'Chats' || route.name === 'Chat' || route.query?.from?.includes('chats')) {
    return Chats
  }

  return Home
})
</script>

<style scoped lang="scss"></style>
