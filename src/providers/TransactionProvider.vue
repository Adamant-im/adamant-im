<template>
  <slot
    :status="status"
    :fetch-status="fetchStatus"
    :inconsistentStatus="inconsistentStatus"
    :refetch="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useTransactionStatusQuery } from '@/hooks/queries/transaction'
import { CryptoSymbol, tsIcon } from '@/lib/constants'

export default defineComponent({
  props: {
    /**
     * Transaction ID
     */
    txId: {
      type: String,
      required: true
    },
    crypto: {
      type: String as PropType<CryptoSymbol>,
      required: true
    }
  },
  setup(props) {
    const { fetchStatus, status, inconsistentStatus, refetch } = useTransactionStatusQuery(
      props.txId,
      props.crypto
    )
    const statusIcon = computed(() => tsIcon(status.value))

    return {
      fetchStatus,
      status,
      inconsistentStatus,
      statusIcon,
      refetch
    }
  }
})
</script>
