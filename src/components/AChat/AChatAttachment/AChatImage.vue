<template>
  <AChatFileLoader :partner-id="props.partnerId" :file="props.img" :transaction="props.transaction">
    <template
      #default="{
        fileUrl,
        previewUrl,
        width,
        height,
        error,
        isLoading,
        uploadProgress,
        downloadFileProgress,
        downloadPreviewProgress,
        allowAutoDownloadPreview
      }"
    >
      <v-img v-if="error" :aspect-ratio="width / height" cover>
        <div :class="classes.fallback">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon v-bind="props" :class="classes.fallbackIcon" :icon="mdiImageOff" />
            </template>

            <span>{{ t('chats.image_loading_error') }}</span>
          </v-tooltip>
        </div>
      </v-img>

      <v-img
        v-else-if="!previewUrl && !allowAutoDownloadPreview && downloadPreviewProgress === 100"
        :aspect-ratio="width / height"
        cover
      >
        <div :class="classes.fallback">
          <v-btn
            :class="[classes.downloadButton, classes.regularButton]"
            icon
            @click="emit('downloadAttachment', props.img)"
          >
            <v-icon :class="classes.fallbackIcon" :icon="mdiArrowCollapseDown" />
          </v-btn>
        </div>
      </v-img>

      <v-img
        v-else
        :src="previewUrl"
        :aspect-ratio="width / height"
        cover
        @click="!isLoading && emit('click')"
      >
        <v-fade-transition>
          <div
            v-show="uploadProgress < 100"
            :class="[classes.placeholder, classes.placeholderTransparent]"
          >
            <v-progress-circular color="grey-lighten-4" :model-value="uploadProgress" />
          </div>
        </v-fade-transition>

        <div
          v-show="previewUrl && !fileUrl"
          :class="[classes.placeholder, classes.placeholderTransparent]"
        >
          <v-btn
            v-if="downloadFileProgress === 100"
            :class="[classes.downloadButton, classes.regularButton]"
            icon
            @click.stop="emit('downloadAttachment', props.img)"
          >
            <v-icon :class="classes.fallbackIcon" :icon="mdiArrowCollapseDown" />
          </v-btn>
          <v-progress-circular v-else color="grey-lighten-4" indeterminate />
        </div>

        <template #placeholder>
          <div :class="classes.placeholder">
            <v-progress-circular color="grey-lighten-4" indeterminate />
          </div>
        </template>
      </v-img>
    </template>
  </AChatFileLoader>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { AChatFileLoader } from './AChatFileLoader'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { LocalFile } from '@/lib/files'
import { FileAsset } from '@/lib/adamant-api/asset'
import { mdiImageOff, mdiArrowCollapseDown } from '@mdi/js'

type Props = {
  transaction: NormalizedChatMessageTransaction
  img: FileAsset | LocalFile
  partnerId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'downloadAttachment', attachment: FileAsset | LocalFile): void
}>()

const className = 'a-chat-image'
const classes = {
  root: className,
  border: `${className}--border`,
  placeholder: `${className}__placeholder`,
  placeholderTransparent: `${className}__placeholder--transparent`,
  fallback: `${className}__fallback`,
  fallbackIcon: `${className}__fallback-icon`,
  downloadButton: `${className}__download-button`,
  regularButton: 'a-btn-regular'
}

const { t } = useI18n()
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.a-chat-image {
  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
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

.v-theme--light {
  .a-chat-image {
    &__placeholder {
      background-color: map.get(colors.$adm-colors, 'secondary2');

      &--transparent {
        background-color: rgba(map.get(colors.$adm-colors, 'grey'), 0.35);
      }
    }

    &__fallback {
      background-color: map.get(colors.$adm-colors, 'secondary2');
    }

    &__fallback-icon {
      color: map.get(settings.$grey, 'darken-1');
    }
  }
}

.v-theme--dark {
  .a-chat-image {
    &__placeholder {
      background-color: map.get(colors.$adm-colors, 'muted');

      &--transparent {
        background-color: map.get(colors.$adm-colors, 'muted');
      }
    }

    &__fallback {
      background-color: map.get(colors.$adm-colors, 'muted');
    }

    &__fallback-icon {
      color: map.get(settings.$shades, 'white');
    }
  }
}
</style>
