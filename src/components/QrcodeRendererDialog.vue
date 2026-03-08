<template>
  <v-dialog v-model="show" width="250" :class="className">
    <v-card>
      <v-card-text :class="`${className}__body`">
        <div :class="`${className}__content`">
          <div :style="{ cursor: 'pointer' }" @click="saveQrcode">
            <QrcodeRenderer ref="qrcode" :text="text" :logo="logoURL" :opts="opts" />
          </div>

          <v-btn :class="[`${className}__button`, 'a-btn-primary']" @click="saveQrcode">
            {{ $t('login.save_qr_code_to_images') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import b64toBlob from 'b64-to-blob'
import FileSaver from 'file-saver'

import QrcodeRenderer from '@/components/QrcodeRenderer.vue'
import { joinUrl } from '@/lib/urlFormatter.js'

export default {
  components: {
    QrcodeRenderer
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    text: {
      type: String,
      default: ''
    },
    logo: {
      type: Boolean,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data: () => ({
    opts: {
      scale: 8.8
    }
  }),
  computed: {
    className: () => 'qrcode-renderer-dialog',
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    logoURL() {
      return this.logo ? joinUrl(import.meta.env.BASE_URL, '/img/adm-qr-invert.png') : ''
    }
  },
  methods: {
    saveQrcode() {
      const imgUrl = this.$refs.qrcode.$el.src
      const base64Data = imgUrl.slice(22, imgUrl.length)
      const byteCharacters = b64toBlob(base64Data)
      const blob = new Blob([byteCharacters], { type: 'image/png' })
      FileSaver.saveAs(blob, 'adamant-im.png')
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;

.qrcode-renderer-dialog {
  @include secondaryDialog.a-secondary-dialog-card-frame();

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__button {
    margin-top: var(--a-space-4);
    margin-bottom: var(--a-space-2);
  }
}
</style>
