<template>
  <div :class="classes.root">
    <AChatImage
      v-if="isImage"
      :transaction="transaction"
      :img="file"
      :partner-id="partnerId"
      :icon-size="iconSize"
      @download-image="onDownloadImage"
      @click="onClick"
    />

    <div v-else :class="classes.fileIcon">
      <v-fade-transition>
        <div
          v-show="uploadProgress < 100 || isDownloading"
          :class="[classes.placeholder, classes.placeholderTransparent, classes.uploadFileProgress]"
        >
          <v-progress-circular
            v-if="uploadProgress < 100"
            color="grey-lighten-4"
            :model-value="uploadProgress"
          />
          <v-progress-circular v-else-if="isDownloading" color="grey-lighten-4" indeterminate />
        </div>
      </v-fade-transition>

      <v-menu
        v-model:active="showMenu"
        activator="parent"
        origin="auto"
        transition="scale-transition"
        :open-on-hover="!isDownloading"
      >
        <template #default>
          <v-list density="comfortable" variant="text" class="pa-0">
            <v-list-item @click="onClick">
              <v-list-item-title>Open</v-list-item-title>
              <template #append>
                <v-icon :icon="mdiArrowUpRight" :size="20" />
              </template>
            </v-list-item>
            <v-divider />
            <v-list-item @click="onDownload">
              <v-list-item-title>Download</v-list-item-title>
              <template #append>
                <v-icon :icon="mdiArrowCollapseDown" :size="20" />
              </template>
            </v-list-item>
          </v-list>
        </template>

        <template #activator="{ props }">
          <IconFile
            v-bind="props"
            :class="classes.icon"
            :text="fileExtensionDisplay"
            :height="iconSize"
            :width="iconSize"
            @click="onClick"
          />
        </template>
      </v-menu>
    </div>

    <div :class="classes.fileInfo">
      <div :class="classes.name">{{ fileName }}</div>
      <div :class="classes.size">{{ formatBytes(fileSize) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { LocalFile, isLocalFile, formatBytes, extractFileExtension } from '@/lib/files'
import { FileAsset } from '@/lib/adamant-api/asset'
import { MAX_FILE_EXTENSION_DISPLAY_LENGTH } from '@/lib/constants'
import IconFile from '@/components/icons/common/IconFile.vue'
import { useStore } from 'vuex'
import { mdiArrowCollapseDown, mdiArrowUpRight } from '@mdi/js'
import { VList } from 'vuetify/components'
import AChatImage from '@/components/AChat/AChatAttachment/AChatImage.vue'
import { useI18n } from 'vue-i18n'
import { isFileImage } from '@/lib/files/helpers/isFileImage'

const className = 'a-chat-file'
const classes = {
  root: className,
  placeholder: `${className}__placeholder`,
  fileIcon: `${className}__file-icon`,
  uploadFileProgress: `${className}__upload-file-progress`,
  placeholderTransparent: `${className}__placeholder--transparent`,
  icon: `${className}__icon`,
  iconWrapper: `${className}__icon-wrapper`,
  fileInfo: `${className}__file-info`,
  name: `${className}__name`,
  size: `${className}__size`,
  preview: `${className}__preview`
}

const iconSize = 64

const props = defineProps<{
  transaction: NormalizedChatMessageTransaction
  file: FileAsset | LocalFile
  partnerId: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'downloadImage', image: FileAsset | LocalFile): void
}>()

const store = useStore()
const { t } = useI18n()

const showMenu = ref(false)

const isImage = computed(() => isFileImage(props.file))

const fileName = computed(() =>
  isLocalFile(props.file) ? props.file.file.name : props.file.name || 'UNNAMED'
)

const fileExtension = computed(() => {
  if (isLocalFile(props.file)) {
    return extractFileExtension(props.file.file.name)
  } else {
    return props.file.extension
  }
})

const fileExtensionDisplay = computed(() => {
  if (fileExtension.value && fileExtension.value.length <= MAX_FILE_EXTENSION_DISPLAY_LENGTH) {
    return fileExtension.value.toUpperCase()
  } else {
    return 'File'
  }
})

const fileSize = computed(() => {
  return isLocalFile(props.file) ? props.file.file.encoded.binary.length : props.file.size
})

const uploadProgress = computed(() => {
  if (isLocalFile(props.file)) {
    return store.getters['attachment/getUploadProgress'](props.file.file.cid)
  }

  return 100
})

const isDownloading = computed(() => {
  const progress = store.getters['attachment/getDownloadProgress'](
    isLocalFile(props.file) ? props.file.file.cid : props.file.id
  )

  return progress < 100
})

const onClick = () => {
  emit('click')
  if (showMenu.value) {
    showMenu.value = false
  }
}

const onDownload = () => {
  try {
    store.dispatch('attachment/downloadFile', {
      transaction: props.transaction,
      file: props.file
    })
  } catch {
    store.dispatch('snackbar/show', {
      message: t('chats.file_not_found'),
      isError: true
    })
  }

  if (showMenu.value) {
    showMenu.value = false
  }
}

const onDownloadImage = (img: FileAsset | LocalFile) => {
  emit('downloadImage', img)
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.a-chat-file {
  display: flex;
  overflow: hidden;

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__preview {
    ::v-deep(.v-img__img) {
      padding: 5px;
    }
  }

  &__file-icon {
    position: relative;
    width: 64px;
    height: 64px;
    cursor: pointer;
  }

  &__upload-file-progress {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 8px;
  }

  &__icon {
    padding: 5px;
    flex-shrink: 0;
  }

  &__file-info {
    margin-left: 8px;
    overflow: hidden;
  }

  &__name {
    font-size: 16px;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__size {
    font-size: 14px;
  }

  &__fallback {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    height: 100%;
    font-weight: 400;
  }

  &__download-button {
    &:hover > .v-btn__overlay {
      opacity: 0.2;
      transition: all 0.2s ease;
    }
  }
}

.v-theme--dark {
  .a-chat-file {
    &__file {
      &:hover {
        background-color: white;
      }
    }

    &__placeholder {
      background-color: map.get(colors.$adm-colors, 'muted');

      &--transparent {
        background-color: map.get(colors.$adm-colors, 'muted');
      }
    }

    &__name {
      color: map.get(settings.$shades, 'white');
    }

    &__size {
      color: map.get(colors.$adm-colors, 'grey');
    }
  }
}

.v-theme--light {
  .a-chat-file {
    &__placeholder {
      background-color: map.get(colors.$adm-colors, 'secondary2');

      &--transparent {
        background-color: rgba(map.get(colors.$adm-colors, 'grey'), 0.35);
      }
    }

    &__name {
      color: map.get(colors.$adm-colors, 'regular');
    }

    &__size {
      color: map.get(colors.$adm-colors, 'muted');
    }
  }
}
</style>
