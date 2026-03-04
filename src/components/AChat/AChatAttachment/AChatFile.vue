<template>
  <div :class="classes.root">
    <AChatFileLoader v-if="isImage" :transaction="transaction" :partnerId="partnerId" :file="file">
      <template #default="{ fileUrl, error, isLoading, uploadProgress }">
        <div v-if="error" :class="classes.errorWrapper">
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
          :width="CHAT_ATTACHMENT_PREVIEW_SIZE"
          :height="CHAT_ATTACHMENT_PREVIEW_SIZE"
          :max-width="CHAT_ATTACHMENT_PREVIEW_SIZE"
          :max-height="CHAT_ATTACHMENT_PREVIEW_SIZE"
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
        >
          <v-progress-circular color="grey-lighten-4" :model-value="uploadProgress" />
        </div>
      </v-fade-transition>

      <IconFile
        :class="classes.icon"
        :text="fileExtensionDisplay"
        :height="CHAT_ATTACHMENT_PREVIEW_SIZE"
        :width="CHAT_ATTACHMENT_PREVIEW_SIZE"
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
import { CHAT_ATTACHMENT_PREVIEW_SIZE } from '../helpers/uiMetrics'

const className = 'a-chat-file'
const classes = {
  root: className,
  placeholder: `${className}__placeholder`,
  fileIcon: `${className}__file-icon`,
  uploadFileProgress: `${className}__upload-file-progress`,
  placeholderTransparent: `${className}__placeholder--transparent`,
  icon: `${className}__icon`,
  errorWrapper: `${className}__error-wrapper`,
  fileInfo: `${className}__file-info`,
  name: `${className}__name`,
  size: `${className}__size`,
  error: `${className}__error`,
  errorIcon: `${className}__error-icon`
}

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
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.a-chat-file {
  --a-chat-file-width: calc(var(--a-space-10) * 4);
  --a-chat-file-preview-size: calc(var(--a-space-4) * 4);
  --a-chat-file-info-gap-inline: var(--a-space-2);
  --a-chat-file-name-font-size: var(--a-font-size-md);
  --a-chat-file-name-font-weight: 400;
  --a-chat-file-size-font-size: var(--a-font-size-sm);
  --a-chat-file-error-font-weight: 400;
  --a-chat-attachment-placeholder-surface: #{map.get(colors.$adm-colors, 'secondary2')};
  --a-chat-attachment-placeholder-surface-transparent: #{rgba(
      map.get(colors.$adm-colors, 'grey'),
      0.35
    )};
  --a-chat-attachment-error-surface: #{map.get(colors.$adm-colors, 'secondary2')};
  --a-chat-attachment-error-icon-color: #{map.get(settings.$grey, 'darken-1')};
  --a-chat-file-name-color: #{map.get(colors.$adm-colors, 'regular')};
  --a-chat-file-size-color: #{map.get(colors.$adm-colors, 'muted')};
  display: flex;
  margin-left: auto;
  width: var(--a-chat-file-width);

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__file-icon {
    position: relative;
    width: var(--a-chat-file-preview-size);
    height: var(--a-chat-file-preview-size);
  }

  &__upload-file-progress {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: var(--a-radius-sm);
  }

  &__icon {
    flex-shrink: 0;
  }

  &__file-info {
    margin-left: var(--a-chat-file-info-gap-inline);
    overflow: hidden;
  }

  &__name {
    font-size: var(--a-chat-file-name-font-size);
    font-weight: var(--a-chat-file-name-font-weight);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--a-chat-file-name-color);
  }

  &__size {
    font-size: var(--a-chat-file-size-font-size);
    color: var(--a-chat-file-size-color);
  }

  &__error {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    height: 100%;
    font-weight: var(--a-chat-file-error-font-weight);
    background-color: var(--a-chat-attachment-error-surface);
  }

  &__error-wrapper {
    width: var(--a-chat-file-preview-size);
    height: var(--a-chat-file-preview-size);
  }

  &__placeholder {
    background-color: var(--a-chat-attachment-placeholder-surface);

    &--transparent {
      background-color: var(--a-chat-attachment-placeholder-surface-transparent);
    }
  }

  &__error-icon {
    color: var(--a-chat-attachment-error-icon-color);
  }
}

.v-theme--dark {
  .a-chat-file {
    --a-chat-attachment-placeholder-surface: #{map.get(colors.$adm-colors, 'muted')};
    --a-chat-attachment-placeholder-surface-transparent: #{map.get(colors.$adm-colors, 'muted')};
    --a-chat-attachment-error-surface: #{map.get(
        colors.$adm-colors,
        'secondary2-slightly-transparent'
      )};
    --a-chat-attachment-error-icon-color: #{map.get(settings.$shades, 'white')};
    --a-chat-file-name-color: #{map.get(settings.$shades, 'white')};
    --a-chat-file-size-color: #{map.get(colors.$adm-colors, 'grey')};
  }
}

.v-theme--light {
  .a-chat-file {
    --a-chat-attachment-placeholder-surface: #{map.get(colors.$adm-colors, 'secondary2')};
    --a-chat-attachment-placeholder-surface-transparent: #{rgba(
        map.get(colors.$adm-colors, 'grey'),
        0.35
      )};
    --a-chat-attachment-error-surface: #{map.get(colors.$adm-colors, 'secondary2')};
    --a-chat-attachment-error-icon-color: #{map.get(settings.$grey, 'darken-1')};
    --a-chat-file-name-color: #{map.get(colors.$adm-colors, 'regular')};
    --a-chat-file-size-color: #{map.get(colors.$adm-colors, 'muted')};
  }
}
</style>
