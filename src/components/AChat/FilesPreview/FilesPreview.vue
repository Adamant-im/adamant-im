<template>
  <div ref="componentContainer" :class="classes.root">
    <div :class="classes.files" ref="previewsContainer">
      <FilesPreviewItem
        v-for="(file, index) in files"
        :key="index"
        :file="file"
        :partner-id="partnerId"
        @remove="emit('remove-item', index)"
      />
    </div>

    <v-btn
      @click="emit('cancel')"
      :class="classes.closeButton"
      :icon="mdiClose"
      size="24"
      variant="plain"
    />
  </div>
</template>

<script lang="ts" setup>
import type { FileData } from '@/lib/files'
import FilesPreviewItem from './FilesPreviewItem.vue'
import { mdiClose } from '@mdi/js'
import { nextTick, onBeforeUnmount, useTemplateRef, watch } from 'vue'

const className = 'files-preview'
const classes = {
  root: className,
  files: `${className}__files`,
  closeButton: `${className}__close-button`
}

type Props = {
  files: FileData[]
  partnerId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'remove-item', index: number): void
  (e: 'restore-scroll', offset: number): void
  (e: 'cancel'): void
}>()

const previewsContainer = useTemplateRef<HTMLDivElement | null>('previewsContainer')
const componentContainer = useTemplateRef<HTMLDivElement | null>('componentContainer')

watch(
  () => props.files.length,
  (newLength, prevLength) => {
    nextTick(() => {
      if (previewsContainer.value && newLength > prevLength) {
        previewsContainer.value.scrollTo({
          left: previewsContainer.value.scrollWidth,
          behavior: 'smooth'
        })
      }
    })
  }
)

onBeforeUnmount(() => {
  emit('restore-scroll', componentContainer.value?.offsetHeight ?? 0)
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.files-preview {
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 8px 16px;
  position: relative;
  border: 3px solid rgba(map.get(colors.$adm-colors, 'grey'), 0.5);
  border-bottom: none;

  &__files {
    display: flex;
    gap: 8px;
    overflow: auto;
    margin-right: 12px;
  }

  &__close-button {
    position: absolute;
    right: 0;
    top: 0;
    margin-right: 4px;
    margin-top: 4px;
  }
}

.v-theme--light {
  .files-preview {
    color: map.get(colors.$adm-colors, 'regular');
  }
}

.v-theme--dark {
  .files-preview {
    color: #fff;
  }
}
</style>
