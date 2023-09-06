<template>
  <div :class="classes.root">
    <a-chat-reaction-select-item
      :class="classes.item"
      v-for="emoji in REACT_EMOJIS"
      :key="emoji"
      :emoji="emoji"
      :model-value="lastReaction ? lastReaction.asset.react_message === emoji : false"
      @update:model-value="onReact"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useStore } from 'vuex'

import { usePartnerId } from '@/components/AChat/hooks/usePartnerId'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import AChatReactionSelectItem from './AChatReactionSelectItem.vue'
import { REACT_EMOJIS } from '@/lib/constants'

const className = 'a-chat-reaction-select'
const classes = {
  root: className,
  item: `${className}__item`
}

export default defineComponent({
  components: {
    AChatReactionSelectItem
  },
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  emits: ['react'],
  setup(props, { emit }) {
    const store = useStore()
    const partnerId = usePartnerId(props.transaction)

    const lastReaction = computed(() =>
      store.getters['chat/lastReaction'](props.transaction.id, partnerId.value, store.state.address)
    )

    const onReact = (state: boolean, emoji: string) => {
      if (!state) {
        // Reaction cannot be deleted
        return
      }

      emit('react', props.transaction.id, emoji)
    }

    return {
      classes,
      REACT_EMOJIS,
      lastReaction,
      onReact
    }
  }
})
</script>

<style lang="scss">
@import 'vuetify/settings';
@import '../../../assets/styles/settings/_colors.scss';

.a-chat-reaction-select {
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 16px;
  cursor: pointer;


  &__item {
  }
}

.v-theme--light {
  .a-chat-reaction-select {
    background-color: map-get($shades, 'white');
    border: 1px solid map-get($adm-colors, 'secondary2');
  }
}

.v-theme--dark {
  .a-chat-reaction-select {
    background-color: map-get($adm-colors, 'regular');
  }
}
</style>
