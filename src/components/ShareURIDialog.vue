<template>
  <v-dialog
    v-model="show"
    width="320"
  >
    <v-card>
      <v-card-title class="a-text-header">
        {{ $t('home.share_uri', { crypto }) }}
      </v-card-title>
      <v-divider class="a-divider" />
      <v-card-text class="pa-0">
        <v-list>
          <v-list-tile @click="copyAddress">
            <v-list-tile-content>
              <v-list-tile-title v-t="'home.copy_address'" />
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile
            v-if="isADM"
            @click="copyURI"
          >
            <v-list-tile-content>
              <v-list-tile-title v-t="'home.copy_uri'" />
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile @click="openQRCodeRenderer">
            <v-list-tile-content>
              <v-list-tile-title v-t="'home.show_qr_code'" />
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-card-text>
    </v-card>
    <QrcodeRendererDialog
      v-model="showQrcodeRendererDialog"
      :logo="isADM"
      :text="uri"
    />
  </v-dialog>
</template>

<script>
import QrcodeRendererDialog from '@/components/QrcodeRendererDialog'
import { copyToClipboard } from '@/lib/textHelpers'
import { generateURI } from '@/lib/uri'

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
    value: {
      required: true,
      type: Boolean
    }
  },
  data: () => ({ showQrcodeRendererDialog: false }),
  computed: {
    show: {
      get () { return this.value },
      set (value) { this.$emit('input', value) }
    },
    uri () {
      return generateURI(this.crypto, this.address)
    }
  },
  methods: {
    copyAddress () {
      copyToClipboard(this.address)
      this.$store.dispatch('snackbar/show', { message: this.$t('home.copied') })
      this.show = false
    },
    copyURI () {
      copyToClipboard(this.uri)
      this.$store.dispatch('snackbar/show', { message: this.$t('home.copied') })
      this.show = false
    },
    openQRCodeRenderer () {
      this.showQrcodeRendererDialog = true
      this.show = false
    }
  }
}
</script>
