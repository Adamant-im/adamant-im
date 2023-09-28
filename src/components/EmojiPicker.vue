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
.emoji-picker {
  border-radius: 8px;

  em-emoji-picker {
    width: 264px;
    height: 264px;
    border-radius: 8px;

    #root {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
  }
}
</style>
