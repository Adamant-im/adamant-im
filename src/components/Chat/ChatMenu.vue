<template>
  <div>
    <v-menu eager v-model="isChatMenuOpen">
      <template #activator="{ props }">
        <v-icon class="chat-menu__icon" v-bind="props" :icon="mdiPlusCircleOutline" size="28" />
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

const { setChatMenuOpen } = chatStateStore

const uploadImageRef = useTemplateRef<InstanceType<typeof UploadFile>>('uploadImageRef')
const uploadFileRef = useTemplateRef<InstanceType<typeof UploadFile>>('uploadFileRef')

const dialog = ref(false)
const dialogTitle = ref('')
const dialogText = ref('')
const crypto = ref('')
const acceptImage = 'image/* , video/*'

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

      if (e.message.includes('Only legacy Lisk address')) {
        dialogTitle.value = t('transfer.legacy_address_title', { crypto: selectedCrypto })
        dialogText.value = t('transfer.legacy_address_text', { crypto: selectedCrypto })
      }

      if (e.message.includes('No crypto wallet address')) {
        dialogTitle.value = t('transfer.no_address_title', { crypto: selectedCrypto })
        dialogText.value = t('transfer.no_address_text', { crypto: selectedCrypto })
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
    .then((address: any) => {
      if (!address) {
        throw new Error('No crypto wallet address')
      } else if (address.onlyLegacyLiskAddress) {
        throw new Error('Only legacy Lisk address')
      }

      return address
    })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/settings';

.chat-menu {
  &__list {
    min-width: 200px;
    max-height: 100vh;

    :deep(.v-list-item-title) {
      font-weight: 400;
    }
  }
}

/** Themes **/
.v-theme--light {
  .chat-menu {
    &__icon {
      color: map.get(settings.$grey, 'darken-1');
    }
  }
}
.v-theme--dark {
  .chat-menu {
    &__icon {
      color: map.get(settings.$shades, 'white');
    }
    &__list {
      :deep(.v-list-item-title) {
        color: map.get(settings.$shades, 'white');
      }
    }
  }
}
</style>
