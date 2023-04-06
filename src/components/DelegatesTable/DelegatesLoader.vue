<template>
  <tr
    class="text-xs-center mt-3 mb-3"
  >
    <td
      class="align-center justify-center d-flex"
      colspan="3"
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
    </td>
    <td class="w-0"></td>
    <td class="w-0" ></td>
  </tr>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    waitingForConfirmation: {
      type: Boolean,
      required: true
    },
  }
})
</script>
