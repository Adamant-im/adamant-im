<template>
  <img v-if="dataUrl" :src="dataUrl" alt="" :class="`${className}__image`" />
  <div v-else :class="`${className}__spinner-container`">
    <InlineSpinner :size="spinnerSize" />
  </div>
</template>

<script>
import InlineSpinner from '@/components/InlineSpinner.vue'
import { logger } from '@/utils/devTools/logger'
import { QRCODE_RENDERER_SPINNER_SIZE } from '@/components/Qrcode/helpers/uiMetrics'
import QRCode from 'qrcode'

const className = 'qrcode-renderer'

export default {
  props: {
    logo: {
      type: String
    },
    opts: {
      type: Object
    },
    text: {
      required: true,
      type: String
    }
  },
  components: {
    InlineSpinner
  },
  data: () => ({
    dataUrl: ''
  }),
  computed: {
    className() {
      return className
    },
    spinnerSize() {
      return QRCODE_RENDERER_SPINNER_SIZE
    }
  },
  watch: {
    text() {
      this.render()
    }
  },
  mounted() {
    this.render()
  },
  methods: {
    render() {
      if (this.text) {
        if (this.logo) {
          QRCode.toCanvas(this.text, this.opts)
            .then((canvas) => {
              const dHeight = canvas.height / 6
              const dWidth = canvas.width / 6
              const dy = canvas.height / 2 - dHeight / 2
              const dx = canvas.width / 2 - dWidth / 2
              const ctx = canvas.getContext('2d')
              const image = new Image(dWidth, dHeight)
              image.src = this.logo
              image.onload = () => {
                ctx.drawImage(image, dx, dy, dWidth, dHeight)
                this.dataUrl = canvas.toDataURL()
              }
            })
            .catch((error) => logger.log('qrcode-renderer', 'warn', error))
        } else {
          QRCode.toDataURL(this.text, this.opts)
            .then((dataUrl) => {
              this.dataUrl = dataUrl
            })
            .catch((error) => logger.log('qrcode-renderer', 'warn', error))
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_layout-primitives.scss' as layoutPrimitives;

/**
 * 1. Should not be inline to avoid empty element with line-height.
 */
.qrcode-renderer__image {
  display: block; // [1]
  max-width: 100%;
}
.qrcode-renderer__spinner-container {
  @include layoutPrimitives.a-flex-align-center();
  max-width: var(--a-qrcode-renderer-max-width);
  overflow: hidden;
}
</style>
