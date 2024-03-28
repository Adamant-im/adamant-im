<template>
  <div>
    <v-menu eager>
      <template #activator="{ props }">
        <v-icon class="chat-menu__icon" v-bind="props" icon="mdi-plus-circle-outline" size="28" />
      </template>

      <v-list class="chat-menu__list">
        <input style="display: none" multiple ref="fileInput" type="file" @change="uploadFile" />
        <!-- Actions -->
        <v-list-item @click="$refs.fileInput.click()" v-for="item in menuItems" :key="item.title">
          <template #prepend>
            <icon-box>
              <v-icon :icon="item.icon" />
            </icon-box>
          </template>

          <v-list-item-title>{{ $t(item.title) }}</v-list-item-title>
        </v-list-item>

        <!-- Cryptos -->
        <v-list-item v-for="c in wallets" :key="c" @click="sendFunds(c)">
          <template #prepend>
            <crypto-icon :crypto="c" box-centered />
          </template>

          <v-list-item-title>{{ $t('chats.send_crypto', { crypto: c }) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <ChatDialog v-model="dialog" :title="dialogTitle" :text="dialogText" />
  </div>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import ChatDialog from '@/components/Chat/ChatDialog.vue'
import CryptoIcon from '@/components/icons/CryptoIcon.vue'
import IconBox from '@/components/icons/IconBox.vue'

export default {
  components: {
    IconBox,
    ChatDialog,
    CryptoIcon
  },
  props: {
    partnerId: {
      type: String,
      default: ''
    },
    replyToId: {
      type: String
    }
  },
  data: () => ({
    menuItems: [
      {
        type: 'action',
        title: 'chats.attach_image',
        icon: 'mdi-image'
      },
      {
        type: 'action',
        title: 'chats.attach_file',
        icon: 'mdi-file'
      }
    ],
    dialog: false,
    dialogTitle: '',
    dialogText: '',
    crypto: ''
  }),
  computed: {
    orderedVisibleWalletSymbols() {
      return this.$store.getters['wallets/getVisibleOrderedWalletSymbols']
    },
    wallets() {
      return this.orderedVisibleWalletSymbols.map((crypto) => {
        return crypto.symbol
      })
    }
  },
  methods: {
    uploadFile(event) {
      const selectedFiles = event.target.files
      const maxFiles = 10
      if (selectedFiles.length > maxFiles) {
        alert(`Можна вибрати максимум ${maxFiles} файлів`)
        return
      }
      if (selectedFiles.length > 0) {
        const imageData = []
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const reader = new FileReader()
          reader.onload = (e) => {
            imageData.push({ name: file.name, content: e.target.result })

            if (imageData.length === selectedFiles.length) {
              this.$emit('image-selected', imageData)
            }
          }
          reader.readAsDataURL(file)
        }
      }
    },
    sendFunds(crypto) {
      // check if user has crypto wallet
      // otherwise show dialog
      this.fetchCryptoAddress(crypto)
        .then(() => {
          this.$router.push({
            name: 'SendFunds',
            params: {
              cryptoCurrency: crypto,
              recipientAddress: this.partnerId
            },
            query: {
              from: `/chats/${this.partnerId}`,
              replyToId: this.replyToId
            }
          })
        })
        .catch((e) => {
          this.crypto = crypto
          if (e.toString().includes('Only legacy Lisk address')) {
            this.dialogTitle = this.$t('transfer.legacy_address_title', { crypto })
            this.dialogText = this.$t('transfer.legacy_address_text', { crypto })
          }
          if (e.toString().includes('No crypto wallet address')) {
            this.dialogTitle = this.$t('transfer.no_address_title', { crypto })
            this.dialogText = this.$t('transfer.no_address_text', { crypto })
          }
          this.dialog = true
        })
    },
    fetchCryptoAddress(crypto) {
      if (crypto === Cryptos.ADM) {
        return Promise.resolve()
      }

      return this.$store
        .dispatch('partners/fetchAddress', {
          crypto,
          partner: this.partnerId,
          moreInfo: true
        })
        .then((address) => {
          if (!address) {
            throw new Error('No crypto wallet address')
          } else if (address.onlyLegacyLiskAddress) {
            throw new Error('Only legacy Lisk address')
          }

          return address
        })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
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
      color: map-get($grey, 'darken-1');
    }
  }
}
.v-theme--dark {
  .chat-menu {
    &__icon {
      color: map-get($shades, 'white');
    }
    &__list {
      :deep(.v-list-item-title) {
        color: map-get($shades, 'white');
      }
    }
  }
}
</style>
