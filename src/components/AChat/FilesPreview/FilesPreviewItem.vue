<template>
  <div :class="classes.root">
    <div :class="classes.preview">
      <img v-if="file.isImage" :class="classes.img" :alt="file.name" :src="file.content" />
      <IconFile :class="classes.icon" :text="extension" :height="80" :width="80" v-else />

      <v-icon
        v-if="!isLoading"
        size="18"
        :icon="mdiClose"
        @click="$emit('remove')"
        :class="classes.removeIcon"
      />

      <v-fade-transition>
        <div
          v-if="isLoading"
          :class="[
            classes.placeholder,
            classes.placeholderTransparent,
            classes.encryptionInProcess
          ]"
        >
          <v-progress-circular color="grey-lighten-4" indeterminate />
        </div>
      </v-fade-transition>
    </div>

    <p :class="classes.fileName">{{ file.name }}</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import { extractFileExtension, formatFileExtension, FileData } from '@/lib/files'
import IconFile from '@/components/icons/common/IconFile.vue'
import { mdiClose } from '@mdi/js'
import { useAttachments } from '@/stores/attachments'

const className = 'preview-file'
const classes = {
  root: className,
  preview: `${className}__preview`,
  img: `${className}__img`,
  icon: `${className}__icon`,
  removeIcon: `${className}__remove-icon`,
  fileName: `${className}__file-name`,
  placeholder: `${className}__placeholder`,
  placeholderTransparent: `${className}__placeholder--transparent`,
  encryptionInProcess: `${className}__encryption-in-process`
}

export default defineComponent({
  components: {
    IconFile
  },
  emits: ['remove'],
  props: {
    file: {
      type: Object as PropType<FileData>,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const attachments = useAttachments(props.partnerId)()

    const extension = computed(() => {
      const fileExtension = extractFileExtension(props.file.name)
      return formatFileExtension(fileExtension)
    })

    const isLoading = computed(() => attachments.isLoading(props.file))

    return {
      classes,
      extension,
      mdiClose,
      isLoading
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.preview-file {
  width: 80px;
  padding-bottom: 5px;

  &__preview {
    width: 80px;
    height: 80px;
    position: relative;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__encryption-in-process {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 8px;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__file-name {
    font-size: 14px;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }

  &__remove-icon {
    position: absolute;
    top: 2px;
    right: 2px;
    border-radius: 50%;
  }
}

.v-theme--light {
  .preview-file {
    &__remove-icon {
      background-color: map.get(colors.$adm-colors, 'regular');
      color: white;
    }
  }

  &__placeholder {
    background-color: map.get(colors.$adm-colors, 'secondary2');

    &--transparent {
      background-color: rgba(map.get(colors.$adm-colors, 'grey'), 0.35);
    }
  }
}

.v-theme--dark {
  .preview-file {
    &__remove-icon {
      background-color: map.get(colors.$adm-colors, 'regular');
      color: white;
    }
  }

  &__placeholder {
    background-color: map.get(colors.$adm-colors, 'muted');

    &--transparent {
      background-color: map.get(colors.$adm-colors, 'muted');
    }
  }
}
</style>
