<template>
  <div :class="classes.root">
    <div :class="classes.emoji">{{ asset.react_message }}</div>

    <div :class="classes.avatar" v-if="$slots.avatar">
      <slot name="avatar" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ReactionAsset } from '@/lib/adamant-api/asset'

const className = 'a-chat-reaction'
const classes = {
  root: className,
  emoji: `${className}__emoji`,
  avatar: `${className}__avatar`
}

export default defineComponent({
  props: {
    asset: {
      type: Object as PropType<ReactionAsset>,
      required: true
    }
  },
  setup() {
    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';

.a-chat-reaction {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 18px;
  height: 18px;
  position: relative;

  &__emoji {
    text-align: center;
    vertical-align: middle;
    line-height: 1;
    font-size: 12px;
  }

  &__avatar {
    position: absolute;
    bottom: -6px;
    right: -6px;
  }
}

.v-theme--light {
  .a-chat-reaction {
  }
}

.v-theme--dark {
  .a-chat-reaction {
  }
}
</style>
