<template>
  <div
    ref="root"
    :class="{
      [classes.root]: true,
      [classes.positionAbsolute]: position === 'absolute',
      [classes.positionPending]: position === 'absolute' && !isPlacementResolved,
      [classes.alignStart]: alignment === 'start',
      [classes.alignEnd]: alignment === 'end',
      [classes.dropDown]: verticalAlignment === 'down',
      'elevation-9': elevation
    }"
  >
    <div ref="container" />
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/hooks/useTheme'
import { ref, onBeforeUnmount, onMounted, nextTick, PropType } from 'vue'
import axios from 'axios'
import { Picker } from 'emoji-mart'
import { useIsMobile } from '@/hooks/useIsMobile'
import { logger } from '@/utils/devTools/logger'

const className = 'emoji-picker'
const classes = {
  root: className,
  positionAbsolute: `${className}--position-absolute`,
  positionPending: `${className}--position-pending`,
  alignStart: `${className}--align-start`,
  alignEnd: `${className}--align-end`,
  dropDown: `${className}--drop-down`
}

const props = defineProps({
  elevation: {
    type: Boolean
  },
  position: {
    type: String as PropType<'absolute'>
  }
})

const emit = defineEmits<{
  (e: 'emoji:select', native: string): void
}>()

const isMobile = useIsMobile()
const { isDarkTheme } = useTheme()
const root = ref<HTMLElement | null>(null)
const container = ref<HTMLElement>()
const picker = ref<Picker>()
const alignment = ref<'start' | 'end'>('start')
const verticalAlignment = ref<'up' | 'down'>('up')
const isPlacementResolved = ref(props.position !== 'absolute')
const VIEWPORT_PADDING = 8

const waitForLayoutFrame = async () => {
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
}

const updateAlignment = async () => {
  if (props.position !== 'absolute' || !root.value) {
    alignment.value = 'start'
    verticalAlignment.value = 'up'
    isPlacementResolved.value = true
    return
  }

  isPlacementResolved.value = false
  alignment.value = 'start'
  verticalAlignment.value = 'up'
  await waitForLayoutFrame()

  const startRect = root.value.getBoundingClientRect()
  const overflowsRight = startRect.right > window.innerWidth - VIEWPORT_PADDING

  if (overflowsRight) {
    alignment.value = 'end'
    await waitForLayoutFrame()

    const endRect = root.value.getBoundingClientRect()
    if (endRect.left < VIEWPORT_PADDING && startRect.left >= VIEWPORT_PADDING) {
      alignment.value = 'start'
    }
  }

  await waitForLayoutFrame()

  const upperRect = root.value.getBoundingClientRect()
  if (upperRect.top < VIEWPORT_PADDING) {
    verticalAlignment.value = 'down'
    await waitForLayoutFrame()

    const lowerRect = root.value.getBoundingClientRect()
    if (
      lowerRect.bottom > window.innerHeight - VIEWPORT_PADDING &&
      upperRect.bottom <= window.innerHeight - VIEWPORT_PADDING
    ) {
      verticalAlignment.value = 'up'
    }
  }

  isPlacementResolved.value = true
}

onMounted(async () => {
  const { data } = await axios.get(`${import.meta.env.BASE_URL}emojis/data.json`)

  picker.value = new Picker({
    data,
    autoFocus: !isMobile.value, // disable autofocus on mobile devices
    dynamicWidth: true,
    navPosition: 'none',
    previewPosition: 'none',
    theme: isDarkTheme.value ? 'dark' : 'light',
    onEmojiSelect: ({ native }: { native: string }) => {
      emit('emoji:select', native)
    }
  })

  if (container.value && picker.value) {
    container.value.appendChild(picker.value as unknown as Node)
    await updateAlignment()
  } else {
    logger.log('EmojiPicker', 'warn', 'Element not found')
  }

  window.addEventListener('resize', updateAlignment)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateAlignment)
})
</script>

<style lang="scss">
@use 'sass:map';
@use 'vuetify/settings';

.emoji-picker {
  border-radius: var(--a-emoji-picker-radius);

  &--position-absolute {
    // Fix for Chrome on iOS. Don't touch it
    position: absolute;
    bottom: 0;
    left: 0;
    transform-origin: bottom left;
  }

  &--position-pending {
    opacity: 0;
    pointer-events: none;
  }

  &--align-end {
    left: auto;
    right: 0;
    transform-origin: bottom right;
  }

  &--drop-down {
    top: 0;
    bottom: auto;
    transform-origin: top left;
  }

  &--align-end#{&}--drop-down {
    transform-origin: top right;
  }

  em-emoji-picker {
    width: var(--a-emoji-picker-size);
    height: var(--a-emoji-picker-size);
    border-radius: var(--a-emoji-picker-radius);
    border-width: var(--a-emoji-picker-border-width);
    border-style: solid;

    #root {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
  }
}
.v-theme--light {
  em-emoji-picker {
    border-color: rgba(map.get(settings.$shades, 'black'), var(--v-border-opacity));
  }
}
.v-theme--dark {
  em-emoji-picker {
    border-color: rgba(map.get(settings.$shades, 'white'), var(--v-border-opacity));
  }
}
</style>
