<template>
  <div
    :class="{
      [classes.root]: true,
      [classes.selected]: modelValue
    }"
  >
    <div :class="classes.emoji" @click="handleClick">
      {{ emoji }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const className = 'a-chat-reaction-select-item'
const classes = {
  root: className,
  selected: `${className}--selected`,
  emoji: `${className}__emoji`
}

export default defineComponent({
  props: {
    emoji: {
      type: String,
      required: true
    },
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleClick = () => {
      emit('update:modelValue', !props.modelValue, props.emoji)
    }

    return {
      classes,
      handleClick
    }
  }
})
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.a-chat-reaction-select-item {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 50ms ease-out 100ms;

  &__emoji {
    font-size: 24px;
    text-align: center;
    border-radius: inherit;
  }
}

.v-theme--light {
  .a-chat-reaction-select-item {
    &:hover {
      background-color: map.get(colors.$adm-colors, 'secondary2');
    }

    &--selected {
      background-color: map.get(colors.$adm-colors, 'secondary2');
    }
  }
}

.v-theme--dark {
  .a-chat-reaction-select-item {
    &:hover {
      background-color: map.get(colors.$adm-colors, 'secondary2-transparent');
    }

    &--selected {
      background-color: map.get(colors.$adm-colors, 'secondary2-slightly-transparent');
    }
  }
}
</style>
