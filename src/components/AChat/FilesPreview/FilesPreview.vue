<template>
  <div :class="classes.root">
    <div :class="classes.files">
      <FilesPreviewItem
        v-for="(file, index) in files"
        :key="index"
        :file="file"
        @remove="$emit('remove-item', index)"
      />
    </div>

    <v-btn
      @click="$emit('cancel')"
      :class="classes.closeButton"
      :icon="mdiClose"
      :size="COMMON_ICON_SIZE"
      variant="plain"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import type { FileData } from '@/lib/files'
import FilesPreviewItem from './FilesPreviewItem.vue'
import { mdiClose } from '@mdi/js'
import { COMMON_ICON_SIZE } from '@/components/common/helpers/uiMetrics'

const className = 'files-preview'
const classes = {
  root: className,
  files: `${className}__files`,
  closeButton: `${className}__close-button`
}

export default defineComponent({
  components: {
    FilesPreviewItem
  },
  emits: ['cancel', 'remove-item'],
  props: {
    files: {
      type: Array as PropType<Array<FileData>>,
      required: true
    }
  },
  setup() {
    return {
      classes,
      COMMON_ICON_SIZE,
      mdiClose
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.files-preview {
  border-radius: var(--a-radius-sm);
  margin-bottom: var(--a-space-2);
  padding: var(--a-space-2) var(--a-space-4);
  position: relative;

  &__files {
    display: flex;
    gap: var(--a-space-2);
    overflow: auto;
    margin-right: var(--a-space-3);
  }

  &__close-button {
    position: absolute;
    right: 0;
    top: 0;
    margin-right: var(--a-space-1);
    margin-top: var(--a-space-1);
  }
}

.v-theme--light {
  .files-preview {
    background-color: map.get(colors.$adm-colors, 'secondary');
    color: map.get(colors.$adm-colors, 'regular');
    border-left: var(--a-chat-accent-border-width) solid map.get(colors.$adm-colors, 'attention');
  }
}

.v-theme--dark {
  .files-preview {
    background-color: map.get(colors.$adm-colors, 'secondary2-slightly-transparent2');
    color: #fff;
    border-left: var(--a-chat-accent-border-width) solid map.get(colors.$adm-colors, 'attention');
  }
}
</style>
