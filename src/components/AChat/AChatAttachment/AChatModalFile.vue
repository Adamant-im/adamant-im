<template>
  <v-carousel-item :class="classes.root" :max-width="500" :max-height="250">
    <v-card :class="classes.card" width="100%" height="100%">
      <div :class="classes.container">
        <IconFile :width="128" :height="128" :text="fileExtension" />

        <div>
          <div :class="classes.fileName">{{ fileName }}</div>
          <div :class="classes.fileSize">{{ formatBytes(fileSize) }}</div>

          <slot />
        </div>
      </div>
    </v-card>
  </v-carousel-item>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import IconFile from '@/components/icons/common/IconFile.vue'
import { FileAsset } from '@/lib/adamant-api/asset'
import { formatBytes, formatFileExtension } from '@/lib/files'

const className = 'a-chat-modal-file'
const classes = {
  root: className,
  card: `${className}__card`,
  container: `${className}__container`,
  fileName: `${className}__file-name`,
  fileSize: `${className}__file-size`
}

export default defineComponent({
  components: { IconFile },
  props: {
    file: {
      type: Object as PropType<FileAsset>,
      required: true
    }
  },
  setup(props) {
    const fileExtension = computed(() => formatFileExtension(props.file.extension))

    const fileName = computed(() => {
      const { name = '', extension } = props.file

      if (extension) {
        return `${name}.${extension}`
      } else if (name) {
        return `${name}`
      }

      return 'UNNAMED'
    })

    const fileSize = computed(() => props.file.size)

    return {
      classes,
      fileName,
      fileExtension,
      fileSize,
      formatBytes
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.a-chat-modal-file {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-grow: unset;

  :deep(.v-responsive__content) {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  &__card {
    margin: 8px;
  }

  &__container {
    height: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  &__file-name {
    @include mixins.a-text-caption();
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
  }

  &__file-size {
    @include mixins.a-text-regular-enlarged();
  }
}

.v-theme--dark {
  .a-chat-modal-file {
    &__card {
      background-color: map.get(colors.$adm-colors, 'black2');
      border: 1px solid map.get(colors.$adm-colors, 'secondary2-slightly-transparent');
    }

    &__file-name {
      color: map.get(settings.$shades, 'white');
    }

    &__file-size {
      color: map.get(colors.$adm-colors, 'grey-transparent');
    }
  }
}

.v-theme--light {
  .a-chat-modal-file {
    &__card {
      background-color: map.get(colors.$adm-colors, 'secondary2');
      border: 1px solid map.get(colors.$adm-colors, 'secondary');
    }

    &__file-name {
      color: map.get(colors.$adm-colors, 'regular');
    }

    &__file-size {
      color: map.get(colors.$adm-colors, 'muted');
    }
  }
}
</style>
