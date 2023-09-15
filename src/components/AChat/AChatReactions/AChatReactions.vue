<template>
  <div
    v-if="displayReactions"
    :class="{
      [classes.root]: true,
      [classes.left]: transaction.senderId === partnerId
    }"
  >
    <a-chat-reaction v-if="displayPartnerReaction" :asset="partnerReaction.asset" />
    <a-chat-reaction v-if="displayMyReaction" :asset="myReaction.asset">
      <template #avatar>
        <ChatAvatar user-id="U123456" :size="18" />
      </template>
    </a-chat-reaction>
  </div>
</template>

<script lang="ts">
import { usePartnerId } from '@/components/AChat/hooks/usePartnerId.ts'
import ChatAvatar from '@/components/Chat/ChatAvatar.vue'
import { isEmptyReaction } from '@/lib/chat/helpers'
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
    ChatAvatar,
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

    const displayMyReaction = computed(() => myReaction.value && !isEmptyReaction(myReaction.value))
    const displayPartnerReaction = computed(
      () => partnerReaction.value && !isEmptyReaction(partnerReaction.value)
    )
    const displayReactions = computed(() => displayMyReaction.value || displayPartnerReaction.value)

    return {
      classes,
      partnerId,
      myReaction,
      partnerReaction,
      displayMyReaction,
      displayPartnerReaction,
      displayReactions
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
  flex-direction: row;
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
    background-color: map-get($adm-colors, 'secondary2-slightly-transparent');
  }
}
</style>
