<template>
  <Modal v-for="modal in modals" :key="modal.id" :modal="modal" />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

import Modal from './Modal.vue'
import { useModalsStore } from '@/stores/modals'

const modalsStore = useModalsStore()
const { modals } = storeToRefs(modalsStore)
</script>
