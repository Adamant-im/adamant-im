<template>
  <template v-if="isUnknownCrypto">
    <slot
      :status="TransactionStatus.UNKNOWN"
      :query-status="TransactionStatus.CONFIRMED"
      :inconsistentStatus="''"
      :refetch="() => void 0"
    />
  </template>

  <TransactionStatusProvider v-else :transaction="transaction">
    <template #default="props">
      <slot v-bind="props" />
    </template>
  </TransactionStatusProvider>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import TransactionStatusProvider from './TransactionStatusProvider.vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { TransactionStatus } from '@/lib/constants'

export default defineComponent({
  components: {
    TransactionStatusProvider
  },
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  setup(props) {
    const isUnknownCrypto = computed(() => props.transaction.type === 'UNKNOWN_CRYPTO')

    return {
      TransactionStatus,
      isUnknownCrypto
    }
  }
})
</script>
