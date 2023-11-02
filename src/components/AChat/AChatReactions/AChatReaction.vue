<template>
  <div :class="classes.root">
    <div
      :class="{
        [classes.emoji]: true,
        [classes.emojiAnimate]: reactionId === $store.state.chat.animatedReactionId
      }"
    >
      {{ asset.react_message }}
    </div>

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
  emojiAnimate: `${className}__emoji--animate`,
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
  width: 24px;
  height: 24px;
  position: relative;

  &__emoji {
    text-align: center;
    vertical-align: middle;
    line-height: 1;
    font-size: 16px;
  }

  &__emoji--animate {
    animation: animate__heartBeat 1.5s ease-in-out;
  }

  &__avatar {
    position: absolute;
    bottom: -9px;
    right: -9px;
  }
}
@keyframes animate__heartBeat {
  0% {
    transform: scale(1);
    transform-origin: center center;
    transition-timing-function: ease-out;
  }
  10% {
    transform: scale(1.35);
    transition-timing-function: ease-in;
  }
  17% {
    transform: scale(1.43);
    transition-timing-function: ease-out;
  }
  33% {
    transform: scale(1.28);
    transition-timing-function: ease-in;
  }
  45% {
    transform: scale(1);
    transition-timing-function: ease-out;
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
