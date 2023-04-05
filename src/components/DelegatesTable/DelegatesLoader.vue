<template>
  <div
    class="text-xs-center mt-3 mb-3"
  >
    <v-layout
      class="align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="24"
        class="mr-3"
      />
      <div
        class="a-text-regular"
        style="line-height:1"
      >
        {{ waitingForConfirmation ? $t('votes.waiting_confirmations') : $t('votes.loading_delegates') }}
      </div>
    </v-layout>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    waitingForConfirmation: Boolean,
  }
})
</script>
