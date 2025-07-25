<template>
  <div :class="classes.root">
    <AChatFileLoader v-if="isImage" :transaction="transaction" :partnerId="partnerId" :file="file">
      <template #default="{ fileUrl, error, isLoading, uploadProgress }">
        <div v-if="error" :style="{ width: `${iconSize}px`, height: `${iconSize}px` }">
          <div :class="classes.error">
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon v-bind="props" :class="classes.errorIcon" :icon="mdiImageOff" />
              </template>

              <span>{{ t('chats.file_loading_error') }}</span>
            </v-tooltip>
          </div>
        </div>

        <v-img
          v-else
          :src="fileUrl"
          :width="iconSize"
          :height="iconSize"
          :max-width="iconSize"
          :max-height="iconSize"
          cover
          @click="!isLoading && $emit('click')"
        >
          <v-fade-transition>
            <div
              v-show="uploadProgress < 100"
              :class="[classes.placeholder, classes.placeholderTransparent]"
            >
              <v-progress-circular color="grey-lighten-4" :model-value="uploadProgress" />
            </div>
          </v-fade-transition>

          <template #placeholder>
            <div :class="classes.placeholder">
              <v-progress-circular color="grey-lighten-4" indeterminate />
            </div>
          </template>
        </v-img>
      </template>
    </AChatFileLoader>

    <div v-else :class="classes.fileIcon">
      <v-fade-transition>
        <div
          v-show="uploadProgress < 100"
          :class="[classes.placeholder, classes.placeholderTransparent, classes.uploadFileProgress]"
          style=""
        >
          <v-progress-circular color="grey-lighten-4" :model-value="uploadProgress" />
        </div>
      </v-fade-transition>

      <IconFile
        :class="classes.icon"
        :text="fileExtensionDisplay"
        :height="iconSize"
        :width="iconSize"
        @click="$emit('click')"
      />
    </div>

    <div :class="classes.fileInfo">
      <div :class="classes.name">{{ fileName }}</div>
      <div :class="classes.size">{{ formatBytes(fileSize) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { LocalFile, isLocalFile, formatBytes, extractFileExtension } from '@/lib/files'
import { FileAsset } from '@/lib/adamant-api/asset'
import { MAX_FILE_EXTENSION_DISPLAY_LENGTH } from '@/lib/constants'
import IconFile from '@/components/icons/common/IconFile.vue'
import { useStore } from 'vuex'
import { AChatFileLoader } from './AChatFileLoader'
import { mdiImageOff } from '@mdi/js'
import { useConsiderOffline } from '@/hooks/useConsiderOffline'

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
  error: `${className}__error`,
  errorIcon: `${className}__error-icon`
}

const iconSize = 64

const props = defineProps<{
  transaction: NormalizedChatMessageTransaction
  file: FileAsset | LocalFile
  partnerId: string
}>()

defineEmits<{
  (e: 'click'): void
}>()

const { t } = useI18n()
const store = useStore()

const isImage = computed(() => {
  if (isLocalFile(props.file)) {
    return props.file.file.isImage
  }

  return ['jpg', 'jpeg', 'png'].includes(props.file.extension!)
})

const { consideredOffline } = useConsiderOffline()


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
    if (consideredOffline.value) {
      return 0;
    }

    return store.getters['attachment/getUploadProgress'](props.file.file.cid)
  }

  return 100
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.a-chat-file {
  display: flex;
  margin-left: auto;
  width: 160px;

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__file-icon {
    position: relative;
    width: 64px;
    height: 64px;
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

  &__error {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    height: 100%;
    font-weight: 400;
  }
}

.v-theme--dark {
  .a-chat-file {
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

    &__error {
      background-color: map.get(colors.$adm-colors, 'secondary2-slightly-transparent');
    }

    &__error-icon {
      color: map.get(settings.$shades, 'white');
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

    &__error {
      background-color: map.get(colors.$adm-colors, 'secondary2');
    }

    &__error-icon {
      color: map.get(settings.$grey, 'darken-1');
    }
  }
}
</style>
