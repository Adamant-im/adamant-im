<template>
  <div>
    <v-menu eager v-model="isChatMenuOpen" :open-on-hover="isDesktop">
      <template #activator="{ props }">
        <v-icon
          class="chat-menu__icon"
          v-bind="props"
          :icon="mdiPlusCircleOutline"
          :size="COMMON_TRIGGER_ICON_SIZE"
        />
      </template>

      <UploadFile
        ref="uploadImageRef"
        :partnerId="partnerId"
        :accept="acceptImage"
        @file="handleFileSelected"
      />
      <UploadFile ref="uploadFileRef" :partnerId="partnerId" @file="handleFileSelected" />

      <v-list class="chat-menu__list">
        <!-- Attach Image -->
        <v-list-item @click="uploadImageRef?.$el?.click()">
          <template #prepend>
            <icon-box>
              <v-icon :icon="mdiImage" />
            </icon-box>
          </template>
          <v-list-item-title>{{ t('chats.attach_image') }}</v-list-item-title>
        </v-list-item>

        <!-- Attach File -->
        <v-list-item @click="uploadFileRef?.$el?.click()">
          <template #prepend>
            <icon-box>
              <v-icon :icon="mdiFile" />
            </icon-box>
          </template>
          <v-list-item-title>{{ t('chats.attach_file') }}</v-list-item-title>
        </v-list-item>

        <!-- Cryptos -->
        <v-list-item v-for="c in wallets" :key="c" @click="sendFunds(c)">
          <template #prepend>
            <crypto-icon :crypto="c" box-centered />
          </template>
          <v-list-item-title>
            {{ t('chats.send_crypto', { crypto: c }) }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <ChatDialog v-model="dialog" :title="dialogTitle" :text="dialogText" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { Cryptos } from '@/lib/constants'
import ChatDialog from '@/components/Chat/ChatDialog.vue'
import CryptoIcon from '@/components/icons/CryptoIcon.vue'
import IconBox from '@/components/icons/IconBox.vue'
import UploadFile from '../UploadFile.vue'
import { mdiFile, mdiImage, mdiPlusCircleOutline } from '@mdi/js'
import { useChatStateStore } from '@/stores/modal-state'
import type { FileData } from '@/lib/files'
import { CoinSymbol } from '@/store/modules/wallets/types'
import { isAllNodesDisabledError, isAllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { useScreenSize } from '@/hooks/useScreenSize'
import { COMMON_TRIGGER_ICON_SIZE } from '@/components/common/helpers/uiMetrics'

const fetchingErrors = {
  noAddress: 'No crypto wallet address',
  connection: 'Connection error'
} as const

const emit = defineEmits<{
  (e: 'files', value: FileData[]): void
}>()

const { partnerId = '', replyToId } = defineProps<{
  partnerId?: string
  replyToId?: string
}>()

const router = useRouter()
const store = useStore()
const { t } = useI18n()
const chatStateStore = useChatStateStore()
const { isMobileView } = useScreenSize()
const { setChatMenuOpen } = chatStateStore

const uploadImageRef = useTemplateRef<InstanceType<typeof UploadFile>>('uploadImageRef')
const uploadFileRef = useTemplateRef<InstanceType<typeof UploadFile>>('uploadFileRef')

const dialog = ref(false)
const dialogTitle = ref('')
const dialogText = ref('')
const crypto = ref('')
const acceptImage = 'image/* , video/*'

const isDesktop = !isMobileView.value

const isChatMenuOpen = computed({
  get: () => chatStateStore.isChatMenuOpen,
  set: setChatMenuOpen
})

const orderedVisibleWalletSymbols = computed(
  () => store.getters['wallets/getVisibleOrderedWalletSymbols']
)

const wallets = computed(() => orderedVisibleWalletSymbols.value.map((c: CoinSymbol) => c.symbol))

function handleFileSelected(imageData: FileData) {
  emit('files', [imageData])
}

function sendFunds(selectedCrypto: string) {
  fetchCryptoAddress(selectedCrypto)
    .then(() => {
      router.push({
        name: 'SendFunds',
        params: {
          cryptoCurrency: selectedCrypto,
          recipientAddress: partnerId || ''
        },
        query: {
          from: `/chats/${partnerId}`,
          replyToId
        }
      })
    })
    .catch((e: Error) => {
      crypto.value = selectedCrypto

      if (e.message.includes(fetchingErrors.noAddress)) {
        dialogTitle.value = t('transfer.no_address_title', { crypto: selectedCrypto })
        dialogText.value = t('transfer.no_address_text', { crypto: selectedCrypto })
      }

      if (e.message.includes(fetchingErrors.connection)) {
        dialogTitle.value = t('transfer.no_address_title_offline')
        dialogText.value = t('transfer.no_address_text_offline', { crypto: selectedCrypto })
      }

      dialog.value = true
    })
}

function fetchCryptoAddress(selectedCrypto: string): Promise<any> {
  if (selectedCrypto === Cryptos.ADM) {
    return Promise.resolve()
  }

  return store
    .dispatch('partners/fetchAddress', {
      crypto: selectedCrypto,
      partner: partnerId,
      moreInfo: true
    })
    .catch((error: Error) => {
      if (isAllNodesOfflineError(error) || isAllNodesDisabledError(error)) {
        throw new Error(fetchingErrors.connection)
      }
    })
    .then((address: any) => {
      if (!address) {
        throw new Error(fetchingErrors.noAddress)
      }

      return address
    })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/settings';

.chat-menu {
  &__icon {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0;
      transition: 0.4s;
      z-index: -1;
    }

    &:hover::before {
      opacity: 0.1;
    }
  }

  &__list {
    min-width: calc((var(--a-control-size-lg) * 4) + var(--a-space-2));
    max-height: 100vh;

    :deep(.v-list-item-title) {
      font-weight: 300;
    }
  }
}

.v-theme--light {
  .chat-menu {
    &__icon {
      color: map.get(settings.$grey, 'darken-1');
    }
  }
}

.v-theme--dark {
  .chat-menu {
    &__list {
      :deep(.v-list-item-title) {
        color: map.get(settings.$shades, 'white');
      }
    }
  }
}
</style>
