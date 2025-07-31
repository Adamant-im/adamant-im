<template>
  <slot />

  <app-snackbar />
  <app-navigation v-if="showNavigation" />
</template>

<script setup lang="ts">
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppNavigation from '@/components/AppNavigation.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useStore } from 'vuex'

const route = useRoute()
const store = useStore()

const isLogged = computed(() => {
  return store.getters.isLogged
})

const showNavigation = computed(() => {
  return (route.meta.showNavigation && isLogged.value) || false
})
</script>
