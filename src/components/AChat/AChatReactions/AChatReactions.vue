<template>
  <div
    v-if="
      (partnerReaction && !isEmptyReaction(partnerReaction)) ||
      (myReaction && !isEmptyReaction(myReaction))
    "
    :class="{
      [classes.root]: true,
      [classes.left]: transaction.senderId === partnerId
    }"
  >
    <a-chat-reaction v-if="partnerReaction" :asset="partnerReaction.asset" />
    <a-chat-reaction v-if="myReaction" :asset="myReaction.asset" />
  </div>
</template>

<script lang="ts">
import { usePartnerId } from '@/components/AChat/hooks/usePartnerId.ts'
import { computed, defineComponent, PropType } from 'vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { useStore } from 'vuex'
import AChatReaction from './AChatReaction.vue'

const className = 'a-chat-reactions'
const classes = {
  root: className,
  left: `${className}__left`
}

export default defineComponent({
  components: {
    AChatReaction
  },
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const partnerId = usePartnerId(props.transaction)
    const myReaction = computed(() =>
      store.getters['chat/lastReaction'](props.transaction.id, partnerId.value, store.state.address)
    )
    const partnerReaction = computed(() =>
      store.getters['chat/lastReaction'](props.transaction.id, partnerId.value, partnerId.value)
    )

    const isEmptyReaction = (reaction: NormalizedChatMessageTransaction) =>
      reaction.asset.react_message === ''

    return {
      classes,
      partnerId,
      myReaction,
      partnerReaction,
      isEmptyReaction
    }
  }
})
</script>

<style lang="scss">
@import 'vuetify/settings';
@import '../../../assets/styles/settings/_colors.scss';

.a-chat-reactions {
  position: absolute;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  border-radius: 8px;
  padding: 2px;

  bottom: 0;

  right: 100%;
  margin-right: -4px;
  margin-bottom: -4px;

  cursor: default;
  user-select: none;

  &__left {
    right: unset;
    left: 100%;
    margin-right: unset;
    margin-left: -4px;
  }
}

.v-theme--light {
  .a-chat-reactions {
    background-color: map-get($adm-colors, 'secondary');
  }
}

.v-theme--dark {
  .a-chat-reactions {
    background-color: map-get($adm-colors, 'regular');
  }
}
</style>
