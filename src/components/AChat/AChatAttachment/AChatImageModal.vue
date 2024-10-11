<template>
  <v-dialog v-model="show" fullscreen :class="classes.root" @keydown="handleKeydown">
    <v-card :class="classes.container">
      <v-toolbar color="transparent">
        <v-btn icon="mdi-close" @click="closeModal" />

        <div :class="classes.imageCounter">{{ slide + 1 }} of {{ files.length }}</div>

        <v-btn icon="mdi-arrow-collapse-down" :class="classes.saveButton" @click="downloadImage" />
      </v-toolbar>

      <v-carousel
        v-model="slide"
        :class="classes.carousel"
        height="100%"
        hide-delimiters
        :show-arrows="showArrows"
        @click="handleClick"
      >
        <AChatImageModalItem
          v-for="(item, i) in files"
          :key="i"
          :transaction="transaction"
          :file="item"
        />

        <template #prev>
          <v-btn icon variant="plain" @click="prevSlide">
            <v-icon icon="mdi-chevron-left" size="x-large" />
          </v-btn>
        </template>
        <template #next>
          <v-btn icon variant="plain" @click="nextSlide">
            <v-icon icon="mdi-chevron-right" size="x-large" />
          </v-btn>
        </template>
      </v-carousel>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ref, computed, onMounted, PropType } from 'vue'
import { useStore } from 'vuex'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

import AChatImageModalItem from './AChatImageModalItem.vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'

function downloadFileByUrl(url: string, filename = 'unnamed') {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename

  document.body.appendChild(anchor)
  anchor.click()

  document.body.removeChild(anchor)
}

const className = 'a-chat-image-modal'
const classes = {
  root: className,
  container: `${className}__container`,
  carousel: `${className}__carousel`,
  saveButton: `${className}__save-btn`,
  closeButton: `${className}__close-btn`,
  imageCounter: `${className}__img-counter`
}

export default {
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    files: {
      type: Array as PropType<Array<FileAsset>>,
      required: true
    },
    /**
     * Default index of the current image in the image slider.
     */
    index: {
      type: Number,
      required: true
    },
    /**
     * Modal visibility state
     */
    modal: {
      type: Boolean,
      required: true
    }
  },
  components: {
    AChatImageModalItem
  },
  emits: ['close', 'update:modal'],
  setup(props, { emit }) {
    const store = useStore()
    const slide = ref(0)

    const breakpoints = useBreakpoints(breakpointsTailwind)
    const isMobile = breakpoints.smaller('sm')

    onMounted(() => {
      slide.value = props.index
    })

    const show = computed({
      get() {
        return props.modal
      },
      set(value) {
        emit('update:modal', value)
      }
    })
    const showArrows = computed(() => {
      return props.files.length > 1 && !isMobile.value
    })

    const closeModal = () => {
      emit('close')
    }

    const prevSlide = () => {
      if (slide.value > 0) {
        slide.value = slide.value - 1
      }
    }
    const nextSlide = () => {
      if (slide.value < props.files.length - 1) {
        slide.value = slide.value + 1
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide()
      } else if (e.key === 'ArrowRight') {
        nextSlide()
      }
    }

    const handleClick = (e: MouseEvent) => {
      const clickedOutside = (e.target as HTMLElement)?.classList?.contains('v-window-item')

      if (clickedOutside) {
        emit('close')
      }
    }

    const publicKey = computed(() =>
      props.transaction.senderId === store.state.address
        ? props.transaction.recipientPublicKey
        : props.transaction.senderPublicKey
    )
    const downloadImage = async () => {
      const file = props.files[slide.value]
      if (!file) {
        console.warn(
          `Failed to download the file. Reason: The file with index ${slide.value} does not exist`
        )
        return
      }

      const { id, nonce } = file
      const imageUrl = await store.dispatch('attachment/getAttachmentUrl', {
        cid: id,
        publicKey: publicKey.value,
        nonce
      })
      const fileName = file.name ? `${file.name}.${file.extension}` : undefined

      downloadFileByUrl(imageUrl, fileName)
    }

    return {
      slide,
      show,
      showArrows,
      closeModal,
      prevSlide,
      nextSlide,
      handleKeydown,
      handleClick,
      downloadImage,
      classes
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
@import '@/assets/styles/themes/adamant/_mixins.scss';
@import '@/assets/styles/settings/_colors.scss';

.a-chat-image-modal {
  &__container {
    position: relative;
    padding-bottom: 32px;
  }
  &__close-btn {
  }
  &__save-btn {
  }
  &__carousel {
  }
  &__img-counter {
    @include a-text-header();
    flex-grow: 1;
    flex-shrink: 1;
    margin-inline-start: 0;
    text-align: center;
  }
}

.v-theme--dark {
  .a-chat-image-modal {
    &__container {
      background-color: map-get($adm-colors, 'muted');
    }
  }
}

.v-theme--light {
  .a-chat-image-modal {
    &__container {
      background-color: map-get($adm-colors, 'grey-transparent');
    }
  }
}
</style>
