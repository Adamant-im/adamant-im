<template>
  <div
    :class="{
      [classes.root]: true,
      'elevation-9': elevation
    }"
  >
    <div ref="container" />
  </div>
</template>

<script lang="ts">
import { useTheme } from '@/hooks/useTheme'
import axios from 'axios'
import { defineComponent, onMounted, ref } from 'vue'
import { Picker } from 'emoji-mart'
import { isMobile } from '@/lib/display-mobile'

const className = 'emoji-picker'
const classes = {
  root: className
}

export default defineComponent({
  props: {
    elevation: {
      type: Boolean
    }
  },
  emits: ['emoji:select'],
  setup(props, { emit }) {
    const { isDarkTheme } = useTheme()
    const container = ref<HTMLElement>()
    const picker = ref<Picker>()

    onMounted(async () => {
      const { data } = await axios.get('/emojis/data.json')

      picker.value = new Picker({
        data,
        autoFocus: !isMobile(), // disable autofocus on mobile devices
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
      } else {
        console.warn('Element not found')
      }
    })

    return {
      container,
      classes
    }
  }
})
</script>

<style lang="scss">
@import 'vuetify/settings';

.emoji-picker {
  border-radius: 8px;
  position: absolute;
  bottom: 0;

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
    border-color: rgba(map-get($shades, 'black'), var(--v-border-opacity));
  }
}
.v-theme--dark {
  em-emoji-picker {
    border-color: rgba(map-get($shades, 'white'), var(--v-border-opacity));
  }
}
</style>
