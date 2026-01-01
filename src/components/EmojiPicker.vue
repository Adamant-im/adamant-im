<template>
  <div
    :class="{
      [classes.root]: true,
      [classes.positionAbsolute]: position === 'absolute',
      'elevation-9': elevation
    }"
  >
    <div ref="container" />
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/hooks/useTheme'
import { ref, onMounted, PropType } from 'vue'
import axios from 'axios'
import { Picker } from 'emoji-mart'
import { useIsMobile } from '@/hooks/useIsMobile'

const className = 'emoji-picker'
const classes = {
  root: className,
  positionAbsolute: `${className}--position-absolute`
}

defineProps({
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
const container = ref<HTMLElement>()
const picker = ref<Picker>()

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
  }
})
</script>

<style lang="scss">
@use 'sass:map';
@use 'vuetify/settings';

.emoji-picker {
  border-radius: 8px;

  &--position-absolute {
    // Fix for Chrome on iOS. Don't touch it
    position: absolute;
    bottom: 0;
  }

  em-emoji-picker {
    width: 264px;
    height: 264px;
    border-radius: 8px;
    border-width: 1px;
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
