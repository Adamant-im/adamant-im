<template>
  <v-dialog v-model="show" fullscreen scrim :class="classes.root" @keydown="handleKeydown">
    <v-card :class="classes.container">
      <div :class="classes.content" @click.capture="handleBackgroundClick">
        <v-toolbar color="transparent">
          <v-btn :icon="mdiClose" @click="closeModal" />

          <div :class="classes.imageCounter">{{ slide + 1 }} of {{ files.length }}</div>

          <v-btn
            :icon="mdiArrowCollapseDown"
            :class="classes.saveButton"
            @click="downloadFile"
            :loading="downloading"
          />
        </v-toolbar>

        <v-carousel
          v-model="slide"
          :class="classes.carousel"
          height="100%"
          hide-delimiters
          :show-arrows="showArrows"
          :continuous="false"
        >
          <template v-for="(file, i) in files" :key="i">
            <AChatImageModalItem v-if="isTypeImage(file)" :transaction="transaction" :file="file" />
            <AChatModalFile v-else :file="file">
              <v-btn
                :class="classes.downloadButton"
                color="primary"
                variant="flat"
                @click="downloadFile"
                :loading="downloading"
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
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ref, computed, onMounted, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem, WriteFileResult } from '@capacitor/filesystem'
import { FileOpener } from '@capacitor-community/file-opener'

import AChatImageModalItem from './AChatImageModalItem.vue'
import AChatModalFile from './AChatModalFile.vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'
import { mdiArrowCollapseDown, mdiChevronLeft, mdiChevronRight, mdiClose } from '@mdi/js'
import { logger } from '@/utils/devTools/logger'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function downloadFileNatively(blobUrl: string, filename: string): Promise<WriteFileResult> {
  const response = await fetch(blobUrl)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)

    reader.onloadend = async () => {
      const base64Data = reader.result?.toString().split(',')[1]

      Filesystem.writeFile({
        path: filename,
        data: base64Data!,
        directory: Directory.Data
      })
        .then(resolve)
        .catch(reject)
    }

    reader.onerror = reject
  })
}

async function downloadFileByUrl(url: string, filename = 'unnamed') {
  if (Capacitor.isNativePlatform()) {
    const fileResult = await downloadFileNatively(url, filename)
    await FileOpener.open({ filePath: fileResult.uri })

    return
  }

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename

  document.body.appendChild(anchor)
  anchor.click()

  document.body.removeChild(anchor)
}

const className = 'a-chat-image-modal'
const activeImageSlideSelector =
  '.v-window-item--active.a-chat-image-modal-item, .v-window-item--active .a-chat-image-modal-item'
const classes = {
  root: className,
  container: `${className}__container`,
  content: `${className}__content`,
  carousel: `${className}__carousel`,
  saveButton: `${className}__save-btn`,
  closeButton: `${className}__close-btn`,
  imageCounter: `${className}__img-counter`,
  downloadButton: `${className}__download-btn`
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
  emits: ['close', 'update:modal'],
  setup(props, { emit }) {
    const store = useStore()
    const { t } = useI18n()
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
      } else if (e.key === 'Escape') {
        e.stopPropagation()
        closeModal()
      }
    }

    const isPointInsideBounds = (
      x: number,
      y: number,
      bounds: { left: number; right: number; top: number; bottom: number }
    ) => {
      return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
    }

    const fitContainBounds = (
      containerRect: DOMRect,
      sourceWidth: number,
      sourceHeight: number
    ) => {
      // `v-img` uses object-fit: contain, so hit-testing against raw container bounds is incorrect
      // for portrait/landscape mismatches. We mirror contain math to get actual bitmap bounds.
      const containerWidth = containerRect.width
      const containerHeight = containerRect.height
      if (containerWidth <= 0 || containerHeight <= 0) {
        return null
      }

      const sourceAspect = sourceWidth / sourceHeight
      const containerAspect = containerWidth / containerHeight
      let renderedWidth = containerWidth
      let renderedHeight = containerHeight

      if (sourceAspect > containerAspect) {
        renderedHeight = containerWidth / sourceAspect
      } else {
        renderedWidth = containerHeight * sourceAspect
      }

      const offsetX = (containerWidth - renderedWidth) / 2
      const offsetY = (containerHeight - renderedHeight) / 2

      return {
        left: containerRect.left + offsetX,
        right: containerRect.left + offsetX + renderedWidth,
        top: containerRect.top + offsetY,
        bottom: containerRect.top + offsetY + renderedHeight
      }
    }

    // Vuetify can render several internal image layers depending on loading state/viewport.
    // We resolve bounds from most precise to broadest fallback to keep backdrop-click behavior stable.
    const getRenderedImageBounds = () => {
      const activeSlide = document.querySelector(activeImageSlideSelector)
      if (!(activeSlide instanceof HTMLElement)) return null

      const imageContainer = activeSlide.querySelector('.v-img')
      const containerRect =
        imageContainer instanceof HTMLElement
          ? imageContainer.getBoundingClientRect()
          : activeSlide.getBoundingClientRect()

      // Preferred source: real decoded image dimensions.
      const pictureImage = activeSlide.querySelector('.v-img__picture img')
      if (
        pictureImage instanceof HTMLImageElement &&
        pictureImage.naturalWidth > 0 &&
        pictureImage.naturalHeight > 0
      ) {
        const containBounds = fitContainBounds(
          containerRect,
          pictureImage.naturalWidth,
          pictureImage.naturalHeight
        )
        if (containBounds) {
          return containBounds
        }
      }

      // Fallback before image decode is complete: dimensions from attachment metadata.
      const resolution = props.files[slide.value]?.resolution
      if (resolution) {
        const [sourceWidth, sourceHeight] = resolution
        if (
          Number.isFinite(sourceWidth) &&
          Number.isFinite(sourceHeight) &&
          sourceWidth > 0 &&
          sourceHeight > 0
        ) {
          const containBounds = fitContainBounds(containerRect, sourceWidth, sourceHeight)
          if (containBounds) {
            return containBounds
          }
        }
      }

      // Last visual fallback: image layer rect that Vuetify paints to screen.
      const imageSurface = activeSlide.querySelector('.v-img__img')
      if (imageSurface instanceof HTMLElement) {
        const imageSurfaceRect = imageSurface.getBoundingClientRect()
        if (imageSurfaceRect.width > 0 && imageSurfaceRect.height > 0) {
          return {
            left: imageSurfaceRect.left,
            right: imageSurfaceRect.right,
            top: imageSurfaceRect.top,
            bottom: imageSurfaceRect.bottom
          }
        }
      }

      // Safety fallback: close behavior still works even if internals change.
      return {
        left: containerRect.left,
        right: containerRect.right,
        top: containerRect.top,
        bottom: containerRect.bottom
      }
    }

    const handleBackgroundClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Toolbar/buttons must keep their own click semantics (navigation/download/close).
      const clickedControl = target.closest('.v-toolbar, .v-btn, button, [role="button"]')
      if (clickedControl) return

      const activeFile = props.files[slide.value]
      if (!activeFile) return

      if (!isTypeImage(activeFile)) {
        // Non-image attachments are centered content cards; click inside card must not close modal.
        const clickedFileContent = target.closest(
          '.v-window-item--active .a-chat-modal-file__container'
        )
        if (clickedFileContent) return

        e.preventDefault()
        e.stopPropagation()
        closeModal()
        return
      }

      const activeImageSlide = document.querySelector(activeImageSlideSelector)
      if (activeImageSlide instanceof HTMLElement && activeImageSlide.contains(target)) {
        // For images we close only if click is outside rendered bitmap (letterbox gutters included).
        const renderedImageBounds = getRenderedImageBounds()
        if (!renderedImageBounds) return

        if (isPointInsideBounds(e.clientX, e.clientY, renderedImageBounds)) {
          return
        }
      }

      e.preventDefault()
      e.stopPropagation()
      closeModal()
    }

    const publicKey = computed(() =>
      props.transaction.senderId === store.state.address
        ? props.transaction.recipientPublicKey
        : props.transaction.senderPublicKey
    )

    const downloading = ref(false)
    const downloadFile = async () => {
      const file = props.files[slide.value]
      if (!file) {
        logger.log(
          'AChatImageModal',
          'warn',
          `Failed to download the file. Reason: The file with index ${slide.value} does not exist`
        )
        return
      }

      try {
        downloading.value = true
        const imageUrl = await store.dispatch('attachment/getAttachmentUrl', {
          cid: file.id,
          publicKey: publicKey.value,
          nonce: file.nonce
        })

        const fileName = file.name
          ? `${file.name}${file.extension ? '.' + file.extension : ''}`
          : undefined
        await downloadFileByUrl(imageUrl, fileName)
      } catch {
        void store.dispatch('snackbar/show', {
          message: t('chats.file_not_found')
        })
      } finally {
        await delay(200) // show loading spinner at least 200ms for smoother UI
        downloading.value = false
      }
    }

    const isTypeImage = (file: FileAsset) => {
      return file.extension ? ['jpg', 'jpeg', 'png'].includes(file.extension) : false
    }

    return {
      slide,
      show,
      showArrows,
      mdiArrowCollapseDown,
      mdiChevronLeft,
      mdiChevronRight,
      mdiClose,
      closeModal,
      prevSlide,
      nextSlide,
      handleKeydown,
      handleBackgroundClick,
      downloadFile,
      downloading,
      isTypeImage,
      classes
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/themes/adamant/_mixins.scss';

.a-chat-image-modal {
  --a-chat-image-modal-surface: transparent;
  --a-chat-image-modal-backdrop-color: rgb(0 0 0 / 40%);

  &__container {
    position: relative;
    padding-bottom: var(--a-space-8);
    background-color: var(--a-chat-image-modal-surface) !important;
    cursor: default;
    -webkit-tap-highlight-color: transparent;
  }
  &__content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  &__close-btn {
  }
  &__save-btn {
  }
  &__carousel {
    flex: 1;
    min-height: 0;
  }
  &__img-counter {
    @include mixins.a-text-header();
    flex-grow: 1;
    flex-shrink: 1;
    margin-inline-start: 0;
    text-align: center;
  }

  &__download-btn {
    margin-top: var(--a-space-3);
  }

  :deep(.v-window),
  :deep(.v-window-item),
  :deep(.v-carousel-item),
  :deep(.v-img),
  :deep(.v-img__img),
  :deep(.v-img__picture img) {
    cursor: default !important;
  }

  :deep(.v-btn),
  :deep(button) {
    cursor: pointer !important;
  }

  :deep(.v-overlay__scrim) {
    opacity: 1 !important;
    background-color: var(--a-chat-image-modal-backdrop-color) !important;
    backdrop-filter: blur(var(--a-chat-image-modal-backdrop-blur));
    -webkit-backdrop-filter: blur(var(--a-chat-image-modal-backdrop-blur));
  }
}

.v-theme--dark {
  .a-chat-image-modal {
    --a-chat-image-modal-surface: transparent;
    --a-chat-image-modal-backdrop-color: rgb(0 0 0 / 40%);
  }
}

.v-theme--light {
  .a-chat-image-modal {
    --a-chat-image-modal-surface: transparent;
    --a-chat-image-modal-backdrop-color: rgb(18 22 30 / 40%);
  }
}
</style>
