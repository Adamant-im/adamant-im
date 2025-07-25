<template>
  <v-dialog v-model="show" fullscreen :class="classes.root" @keydown="handleKeydown">
    <v-card :class="classes.container">
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
        @click="handleClick"
        :continuous="false"
      >
        <template v-for="(file, i) in files" :key="i">
          <AChatImageModalItem v-if="isTypeImage(file)" :transaction="transaction" :file="file" />
          <AChatModalFile v-else :file="file">
            <v-btn
              class="mt-3"
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

    const downloading = ref(false)
    const downloadFile = async () => {
      const file = props.files[slide.value]
      if (!file) {
        console.warn(
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
      handleClick,
      downloadFile,
      downloading,
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
