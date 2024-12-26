<template>
  <v-dialog v-model="show" eager width="320" :class="className">
    <v-card>
      <v-card-title :class="`${className}__dialog-title`" class="a-text-header">
        {{ $t('home.share_uri', { crypto }) }}
      </v-card-title>
      <v-divider class="a-divider" />
      <v-card-text class="pa-0">
        <v-list>
          <v-list-item @click="copyAddress">
            <v-list-item-title :class="`${className}__list-item-title`">
              {{ $t('home.copy_address') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isADM" @click="copyURI">
            <v-list-item-title :class="`${className}__list-item-title`">
              {{ $t('home.copy_uri') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="openQRCodeRenderer">
            <v-list-item-title :class="`${className}__list-item-title`">
              {{ $t('home.show_qr_code') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="!isErc" @click="openInExplorer">
            <v-list-item-title :class="`${className}__list-item-title`">
              {{ $t('home.explorer') }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    <QrcodeRendererDialog v-model="showQrcodeRendererDialog" :logo="isADM" :text="uri" />
  </v-dialog>
</template>

<script>
import QrcodeRendererDialog from '@/components/QrcodeRendererDialog.vue'
import copyToClipboard from 'copy-to-clipboard'
import { generateURI } from '@/lib/uri'
import { isErc20 } from '@/lib/constants'
import { getExplorerAddressUrl } from '@/config/utils'

export default {
  components: { QrcodeRendererDialog },
  props: {
    address: {
      required: true,
      type: String
    },
    crypto: {
      required: true,
      type: String
    },
    isADM: {
      required: true,
      type: Boolean
    },
    modelValue: {
      required: true,
      type: Boolean
    }
  },
  emits: ['update:modelValue'],
  data: () => ({
    className: 'share-uri-dialog',
    showQrcodeRendererDialog: false
  }),
  computed: {
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    uri() {
      return generateURI(this.crypto, this.address)
    },
    isErc() {
      return isErc20(this.crypto)
    }
  },
  methods: {
    copyAddress() {
      copyToClipboard(this.address)
      this.$store.dispatch('snackbar/show', { message: this.$t('home.copied') })
      this.show = false
    },
    copyURI() {
      copyToClipboard(this.uri)
      this.$store.dispatch('snackbar/show', { message: this.$t('home.copied') })
      this.show = false
    },
    openQRCodeRenderer() {
      this.showQrcodeRendererDialog = true
      this.show = false
    },
    openInExplorer() {
      const explorerLink = getExplorerAddressUrl(this.crypto, this.address)
      window.open(explorerLink, '_blank', 'resizable,scrollbars,status,noopener')
    }
  }
}
</script>

<style lang="scss">
@import 'vuetify/_settings.scss';

.share-uri-dialog {
}

.v-theme--dark {
  .share-uri-dialog {
    &__dialog-title {
      color: map-get($shades, 'white');
    }

    &__list-item-title {
      color: map-get($shades, 'white');
    }
  }
}
</style>
