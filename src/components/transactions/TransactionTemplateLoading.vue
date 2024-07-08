<template>
  <TransactionTemplate
    :id="''"
    :amount="''"
    :timestamp="NaN"
    :fee="NaN"
    :confirmations="NaN"
    :sender="''"
    :recipient="''"
    :sender-formatted="''"
    :recipient-formatted="''"
    :explorer-link="explorerLink"
    :partner="''"
    :status="{ status: TransactionStatus.PENDING, virtualStatus: TransactionStatus.PENDING }"
    :adm-tx="{}"
    :crypto="crypto"
    :text-data="''"
  />
</template>

<script lang="ts">
import { CryptoSymbol, TransactionStatus } from '@/lib/constants'
import { defineComponent, PropType } from 'vue'
import TransactionTemplate from './TransactionTemplate.vue'

export default defineComponent({
  props: {
    crypto: {
      required: true,
      type: String as PropType<CryptoSymbol>
    },
    explorerLink: {
      required: true,
      type: String
    }
  },
  setup() {
    return {
      TransactionStatus
    }
  },
  components: {
    TransactionTemplate
  }
})
</script>
