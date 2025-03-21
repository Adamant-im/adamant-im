<template>
  <div :class="classes.root">
    <div
      :class="{
        [classes.emoji]: true,
        [classes.emojiAnimate]: animationEnabled
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
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useStore } from 'vuex'

import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
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
    },
    reaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const store = useStore()

    const animationEnabled = ref(false)
    const animate = () => {
      if (animationEnabled.value) return

      animationEnabled.value = true
      setTimeout(() => {
        animationEnabled.value = false
      }, 1500)
    }

    const numOfNewMessages = computed(() => store.getters['chat/numOfNewMessages'](props.partnerId))
    const isLastReaction = computed(() =>
      store.getters['chat/isLastReaction'](props.reaction.id, props.partnerId)
    )

    const animateIncoming = computed(() => isLastReaction.value && numOfNewMessages.value === 0)
    const animateOutgoing = computed(() => props.reaction.status === 'PENDING')

    watch(numOfNewMessages, () => {
      if (animateIncoming.value) {
        animate()
      }
    })

    watch(
      () => props.reaction,
      () => {
        if (animateOutgoing.value) {
          animate()
        }
      },
      { immediate: true }
    )

    return {
      classes,
      animationEnabled
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'vuetify/settings';

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
  20% {
    transform: scale(1.32);
    transition-timing-function: ease-in;
  }
  40% {
    transform: scale(1);
    transition-timing-function: ease-out;
  }
  60% {
    transform: scale(1.21);
    transition-timing-function: ease-in;
  }
  80% {
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
