<template>
  <v-row justify="center" no-gutters :class="className">
    <app-toolbar-centered app :title="`${id}`" flat fixed :class="`${className}__toolbar`" />
    <container class="container--with-app-toolbar">
      <v-list bg-color="transparent">
        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.amount') }}
            </v-list-item-title>
          </template>

          <v-list-item-title :class="`${className}__value`">
            {{ amount || placeholder }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.currentVal') }}
            </v-list-item-title>
          </template>

          <v-list-item-title v-if="rate !== false" :class="`${className}__value`">
            {{ rate }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.valueTimeTxn') }}
            </v-list-item-title>
          </template>

          <v-list-item-title v-if="historyRate !== false" :class="`${className}__value`">
            {{ historyRate }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />
        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.status') }}
              <v-icon
                v-if="statusUpdatable"
                :class="{
                  [`${className}__update-status-icon--rotate`]: rotateAnimation
                }"
                icon="mdi-refresh"
                size="20"
                @click="updateStatus()"
              />
            </v-list-item-title>
          </template>

          <div :class="`${className}__value ${className}__value-${status.virtualStatus}`">
            <v-icon
              v-if="status.status === 'INVALID'"
              icon="mdi-alert-outline"
              size="20"
              style="color: #f8a061 !important"
            />
            {{ $t(`transaction.statuses.${status.virtualStatus}`)
            }}<span v-if="status.status === 'INVALID'">{{
              ': ' + $t(`transaction.inconsistent_reasons.${status.inconsistentReason}`, { crypto })
            }}</span
            ><span v-if="status.addStatus">{{ ': ' + status.addDescription }}</span>
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.date') }}
            </v-list-item-title>
          </template>

          <v-list-item-title :class="`${className}__value`">
            {{ timestamp ? $formatDate(timestamp) : placeholder }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.confirmations') }}
            </v-list-item-title>
          </template>

          <v-list-item-title :class="`${className}__value`">
            {{ confirmations || placeholder }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.commission') }}
            </v-list-item-title>
          </template>

          <v-list-item-title :class="`${className}__value`">
            {{ fee || placeholder }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item @click="handleCopyToClipboard(id)">
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.txid') }}
            </v-list-item-title>
          </template>

          <v-list-item-title :class="`${className}__value`">
            {{ id || placeholder }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item @click="handleCopyToClipboard(sender)">
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.sender') }}
            </v-list-item-title>
          </template>

          <div :class="`${className}__value`">
            {{ senderFormatted || placeholder }}
          </div>
        </v-list-item>

        <v-divider />

        <v-list-item @click="handleCopyToClipboard(recipient)">
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.recipient') }}
            </v-list-item-title>
          </template>

          <div :class="`${className}__value`">
            {{ recipientFormatted || placeholder }}
          </div>
        </v-list-item>

        <v-divider v-if="comment" />

        <v-list-item v-if="comment">
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.comment') }}
            </v-list-item-title>
          </template>

          <div :class="`${className}__value`">
            {{ comment || placeholder }}
          </div>
        </v-list-item>

        <v-divider v-if="textData" />

        <v-list-item v-if="textData" :title="textData">
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.textData') }}
            </v-list-item-title>
          </template>

          <div :class="`${className}__value`">
            {{ textData || placeholder }}
          </div>
        </v-list-item>

        <v-divider v-if="explorerLink" />

        <v-list-item v-if="explorerLink" @click="openInExplorer">
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ $t('transaction.explorer') }}
            </v-list-item-title>
          </template>

          <v-list-item-title :class="`${className}__value`">
            <v-icon icon="mdi-chevron-right" size="20" />
          </v-list-item-title>
        </v-list-item>

        <v-divider v-if="partner && !ifComeFromChat" />

        <v-list-item v-if="partner && !ifComeFromChat" @click="openChat">
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ hasMessages ? $t('transaction.continueChat') : $t('transaction.startChat') }}
            </v-list-item-title>
          </template>

          <v-list-item-title :class="`${className}__value`">
            <v-icon :icon="hasMessages ? 'mdi-comment' : 'mdi-comment-outline'" size="20" />
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </container>
  </v-row>
</template>

<script>
import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import copyToClipboard from 'copy-to-clipboard'
import { Symbols, tsUpdatable } from '@/lib/constants'
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import { timestampInSec } from '@/filters/helpers'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'

const className = 'transaction-view'

export default defineComponent({
  components: {
    AppToolbarCentered
  },
  props: {
    amount: {
      required: true,
      type: String
    },
    crypto: {
      required: true,
      type: String
    },
    confirmations: {
      required: true,
      type: Number
    },
    explorerLink: {
      required: true,
      type: String
    },
    fee: {
      required: true,
      type: String
    },
    id: {
      required: true,
      type: String
    },
    partner: {
      required: true,
      type: String
    },
    recipient: {
      required: true,
      type: String
    },
    sender: {
      required: true,
      type: String
    },
    recipientFormatted: {
      required: true,
      type: String
    },
    senderFormatted: {
      required: true,
      type: String
    },
    status: {
      required: true,
      type: Object
    },
    timestamp: {
      required: true,
      type: Number
    },
    admTx: {
      required: false,
      type: Object
    },
    textData: {
      required: false,
      type: String
    }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    const hasMessages = computed(() => {
      const chat = store.state.chat.chats[props.partner]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    })

    const placeholder = computed(() => {
      if (!props.status.status) return Symbols.CLOCK
      return props.status.status === 'REJECTED' ? Symbols.CROSS : Symbols.HOURGLASS
    })

    const ifComeFromChat = computed(() =>
      Object.prototype.hasOwnProperty.call(route.query, 'fromChat')
    )

    const comment = computed(() =>
      props.admTx && props.admTx.message ? props.admTx.message : false
    )

    const statusUpdatable = computed(() => tsUpdatable(props.status.virtualStatus, props.crypto))
    const amountNumber = computed(() => props.amount.replace(/[^\d.-]/g, ''))
    const historyRate = computed(() =>
      store.getters['rate/historyRate'](
        timestampInSec(props.crypto, props.timestamp),
        amountNumber.value,
        props.crypto
      )
    )
    const rate = computed(() => store.getters['rate/rate'](amountNumber.value, props.crypto))
    const { fetchTransactionStatus } = useTransactionStatus()

    onMounted(() => {
      if (props.admTx) {
        fetchTransactionStatus(props.admTx, props.partner)
      }
      if (!isNaN(props.timestamp)) {
        getHistoryRates()
      }
    })

    watch(
      () => props.admTx,
      () => {
        fetchTransactionStatus(props.admTx, props.partner)
      }
    )

    watch(
      () => props.timestamp,
      () => {
        nextTick(() => {
          getHistoryRates()
        })
      }
    )

    const handleCopyToClipboard = (key) => {
      if (key) {
        copyToClipboard(key)
        store.dispatch('snackbar/show', {
          message: t('home.copied'),
          timeout: 2000
        })
      }
    }
    const openInExplorer = () => {
      if (props.explorerLink) {
        window.open(props.explorerLink, '_blank', 'resizable,scrollbars,status,noopener')
      }
    }
    const openChat = () => {
      router.push('/chats/' + props.partner + '/')
    }

    const rotateAnimation = ref(false)
    const updateStatus = () => {
      rotateAnimation.value = true
      setTimeout(() => (rotateAnimation.value = false), 1000)

      if (props.crypto && statusUpdatable.value) {
        store.dispatch(props.crypto.toLowerCase() + '/updateTransaction', {
          hash: props.id,
          force: true,
          updateOnly: false,
          dropStatus: true
        })
      }
    }

    const getHistoryRates = () => {
      store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(props.crypto, props.timestamp)
      })
    }

    return {
      className,
      handleCopyToClipboard,
      openInExplorer,
      openChat,
      updateStatus,
      rotateAnimation,
      hasMessages,
      placeholder,
      ifComeFromChat,
      comment,
      statusUpdatable,
      amountNumber,
      historyRate,
      rate
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/settings/_colors.scss';

.transaction-view {
  &__title {
    font-weight: 300;
  }
  &__titlecontent {
    flex: 1 0 auto;
  }
  &__value {
    font-weight: 300;
    font-size: 14px;
    text-align: right;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    width: 100%;
  }
  &__toolbar {
    :deep(.v-toolbar__title) div {
      text-overflow: ellipsis;
      max-width: 100%;
      overflow: hidden;
    }
  }
  &__update-status-icon {
    &--rotate {
      transform: rotate(400grad);
      transition-duration: 1s;
    }
  }
}

/** Themes **/
.v-theme--light {
  .transaction-view {
    &__title {
      color: map-get($adm-colors, 'regular');
    }
    &__value {
      color: map-get($adm-colors, 'muted') !important;
    }
    :deep(.v-divider) {
      border-color: map-get($adm-colors, 'secondary2');
    }
  }
}
.v-theme--light,
.v-theme--dark {
  .transaction-view {
    &__value-REJECTED {
      color: map-get($adm-colors, 'danger') !important;
    }
    &__value-PENDING {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__value-REGISTERED {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__value-CONFIRMED {
      color: map-get($adm-colors, 'good') !important;
    }
    &__value-INVALID {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__value-UNKNOWN {
      color: map-get($adm-colors, 'attention') !important;
    }
  }
}
</style>
