<template>
  <div class="modals-host">
    <Modal v-for="modal in modalsStore.stack" :key="modal.id" :modal="modal" />
  </div>
</template>

<script lang="ts" setup>
import Modal from './Modal.vue'
import { useModalsStore } from '@/stores/modals'

const modalsStore = useModalsStore()
</script>
