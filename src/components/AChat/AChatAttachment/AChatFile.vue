<template>
  <div :class="classes.root">
    <AChatFileLoader v-if="isImage" :transaction="transaction" :partnerId="partnerId" :file="file">
      <template #default="{ fileUrl, error }">
        <div v-if="error" :style="{ width: `${iconSize}px`, height: `${iconSize}px` }">
          <div :class="classes.error">ERROR</div>
        </div>

        <v-img
          v-else
          :src="fileUrl"
          :width="iconSize"
          :height="iconSize"
          :max-width="iconSize"
          :max-height="iconSize"
          cover
          @click="$emit('click')"
        >
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular color="grey-lighten-4" indeterminate />
            </div>
          </template>
        </v-img>
      </template>
    </AChatFileLoader>

    <IconFile
      v-else
      :class="classes.icon"
      :text="fileExtension"
      :height="iconSize"
      :width="iconSize"
    />

    <div :class="classes.fileInfo">
      <div :class="classes.name">{{ fileName }}</div>
      <div :class="classes.size">{{ formatBytes(fileSize) }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'
import IconFile from '@/components/icons/common/IconFile.vue'
import { AChatFileLoader } from './AChatFileLoader.tsx'

function isLocalFile(file: FileAsset | LocalFile): file is LocalFile {
  return 'file' in file && file.file?.file instanceof File
}

function formatBytes(size: number) {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 ** 2) {
    return Math.floor(size / 1024) + ' KB'
  } else if (size < 1024 ** 3) {
    return Math.floor(size / 1024 ** 2) + ' MB'
  } else {
    return parseFloat((size / 1024 ** 3).toFixed(2)) + ' GB'
  }
}

const className = 'a-chat-file'
const classes = {
  root: className,
  icon: `${className}__icon`,
  iconWrapper: `${className}__icon-wrapper`,
  fileInfo: `${className}__file-info`,
  name: `${className}__name`,
  size: `${className}__size`,
  error: `${className}__error`
}

const iconSize = 64

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    file: {
      type: Object as PropType<FileAsset | LocalFile>,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    }
  },
  components: { AChatFileLoader, IconFile },
  setup(props) {
    const isImage = computed(() => {
      if (isLocalFile(props.file)) {
        return props.file.file.isImage
      }

      return ['jpg', 'jpeg', 'png'].includes(props.file.extension!)
    })
    const fileName = computed(() =>
      isLocalFile(props.file) ? props.file.file.name : props.file.name || 'UNNAMED'
    )
    const fileExtension = computed(() =>
      isLocalFile(props.file) ? props.file.file.type : props.file.extension
    )
    const fileSize = computed(() => {
      return isLocalFile(props.file) ? props.file.file.encoded.binary.length : props.file.size
    })

    return {
      classes,
      isImage,
      fileName,
      fileExtension,
      fileSize,
      formatBytes,
      iconSize
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/settings/_colors.scss';
@import '@/assets/styles/themes/adamant/_mixins.scss';

.a-chat-file {
  display: flex;
  margin-left: auto;
  width: 160px;

  &__file-info {
    margin-left: 8px;
  }

  &__name {
    font-size: 16px;
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

.v-theme--light {
  .a-chat-file {
    &__name {
    }

    &__size {
      font-size: 14px;
    }

    &__error {
      background-color: map-get($adm-colors, 'secondary2');
    }
  }
}

.v-theme--dark {
  .a-chat-file {
    &__name {
    }

    &__size {
      color: map-get($adm-colors, 'grey');
    }

    &__error {
      background-color: map-get($adm-colors, 'secondary2-slightly-transparent');
    }
  }
}
</style>
