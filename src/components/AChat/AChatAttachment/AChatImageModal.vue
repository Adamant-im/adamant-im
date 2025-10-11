<template>
  <v-dialog v-model="show" fullscreen :class="classes.root" @keydown="handleKeydown">
    <v-card :class="classes.container">
      <v-toolbar color="transparent">
        <v-btn :icon="mdiClose" @click="closeModal" />

        <div :class="classes.imageCounter">{{ slide + 1 }} of {{ files.length }}</div>

        <v-btn
          :icon="mdiArrowCollapseDown"
          :class="classes.saveButton"
          :loading="isDownloading"
          @click="onDownload"
        />
      </v-toolbar>

      <v-carousel
        v-model="slide"
        :class="classes.carousel"
        height="100%"
        hide-delimiters
        :show-arrows="showArrows"
        @click="handleClick"
        :continuous="false"
      >
        <template v-for="(file, i) in files" :key="i">
          <AChatImageModalItem
            v-if="isTypeImage(file)"
            :transaction="transaction"
            :file="file"
            :is-current-slide="slide === i"
            @close-modal="closeModal"
          />
          <AChatModalFile v-else :file="file">
            <v-btn
              class="mt-3"
              color="primary"
              variant="flat"
              :loading="isDownloading"
              @click="onDownload"
            >
              Download
            </v-btn>
          </AChatModalFile>
        </template>

        <template #prev>
          <v-btn icon variant="plain" @click="prevSlide">
            <v-icon :icon="mdiChevronLeft" size="x-large" />
          </v-btn>
        </template>
        <template #next>
          <v-btn icon variant="plain" @click="nextSlide">
            <v-icon :icon="mdiChevronRight" size="x-large" />
          </v-btn>
        </template>
      </v-carousel>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ref, computed, PropType, onMounted, onBeforeUnmount } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

import AChatImageModalItem from './AChatImageModalItem.vue'
import AChatModalFile from './AChatModalFile.vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'
import { mdiArrowCollapseDown, mdiChevronLeft, mdiChevronRight, mdiClose } from '@mdi/js'
import { App } from '@capacitor/app'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { isFileImage } from '@/lib/files/helpers/isFileImage'

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
    AChatModalFile,
    AChatImageModalItem
  },
  emits: ['close', 'update:modal', 'downloadFile'],
  setup(props, { emit }) {
    const store = useStore()

    const currentSlide = ref(props.index)
    const router = useRouter()

    const breakpoints = useBreakpoints(breakpointsTailwind)
    const isMobile = breakpoints.smaller('sm')

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
    const isDownloading = computed(() => {
      const progress = store.getters['attachment/getDownloadProgress'](
        props.files[currentSlide.value].id
      )
      return progress < 100
    })

    const closeModal = () => {
      emit('close')
      if (history.state?.modalOpen) {
        router.back()
      }
    }

    const prevSlide = () => {
      if (currentSlide.value > 0) {
        currentSlide.value = currentSlide.value - 1
      }
    }
    const nextSlide = () => {
      if (currentSlide.value < props.files.length - 1) {
        currentSlide.value = currentSlide.value + 1
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide()
      } else if (e.key === 'ArrowRight') {
        nextSlide()
      } else if (e.key === 'Escape') {
        e.stopPropagation()
        closeModal()
      }
    }

    const handleClick = (e: MouseEvent) => {
      const clickedOutside = (e.target as HTMLElement)?.classList?.contains('v-window-item')

      if (clickedOutside) {
        emit('close')
      }
    }

    const isTypeImage = (file: FileAsset) => {
      return isFileImage(file)
    }

    let backListener: { remove: () => void } | null = null

    const handleBack = () => {
      if (show.value) {
        closeModal()
      }
    }

    const onDownload = () => {
      emit('downloadFile', props.files[currentSlide.value])
    }

    onMounted(async () => {
      if (show.value) {
        history.pushState({}, '')
      }

      window.addEventListener('popstate', handleBack)

      backListener = await App.addListener('backButton', () => {
        handleBack()
      })
    })

    onBeforeUnmount(() => {
      window.removeEventListener('popstate', handleBack)
      backListener?.remove()
    })

    return {
      slide: currentSlide,
      show,
      showArrows,
      isDownloading,
      mdiArrowCollapseDown,
      mdiChevronLeft,
      mdiChevronRight,
      mdiClose,
      closeModal,
      prevSlide,
      nextSlide,
      handleKeydown,
      handleClick,
      onDownload,
      isTypeImage,
      classes
    }
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

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
    @include mixins.a-text-header();
    flex-grow: 1;
    flex-shrink: 1;
    margin-inline-start: 0;
    text-align: center;
  }
}

.v-theme--dark {
  .a-chat-image-modal {
    &__container {
      background-color: map.get(colors.$adm-colors, 'muted');
    }
  }
}

.v-theme--light {
  .a-chat-image-modal {
    &__container {
      background-color: map.get(colors.$adm-colors, 'grey-transparent');
    }
  }
}
</style>
