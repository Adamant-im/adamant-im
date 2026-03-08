<template>
  <div
    v-if="reactions.length > 0"
    :class="{
      [classes.root]: true,
      [classes.left]: incomingMessage
    }"
  >
    <a-chat-reaction
      v-for="reaction of reactions"
      :key="reaction.senderId"
      :class="classes.reaction"
      :reaction="reaction"
      :asset="reaction.asset"
      :partner-id="partnerId"
    >
      <template #avatar v-if="showPartnerReactionAvatar && reaction.senderId === partnerId">
        <chat-avatar :user-id="partnerId" :size="16" />
      </template>
    </a-chat-reaction>
  </div>
</template>

<script setup lang="ts">
import { usePartnerId } from '@/components/AChat/hooks/usePartnerId'
import { isIncomingMessage } from '@/components/AChat/helpers/isIncomingMessage'
import { isEmptyReaction, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { computed, PropType, watch } from 'vue'
import { useStore } from 'vuex'
import { vibrate } from '@/lib/vibrate'
import { isStringEqualCI } from '@/lib/textHelpers'
import AChatReaction from './AChatReaction.vue'
import ChatAvatar from '@/components/Chat/ChatAvatar.vue'

const className = 'a-chat-reactions'
const classes = {
  root: className,
  left: `${className}--left`,
  reaction: `${className}__reaction`
}

const props = defineProps({
  transaction: {
    type: Object as PropType<NormalizedChatMessageTransaction>,
    required: true
  }
})

const store = useStore()
const partnerId = usePartnerId(props.transaction)
const incomingMessage = computed(() =>
  isIncomingMessage(props.transaction.senderId, store.state.address)
)
const isSelfChat = computed(() => isStringEqualCI(partnerId.value, store.state.address))
const showPartnerReactionAvatar = computed(() => !isSelfChat.value)

const myReaction = computed(() =>
  store.getters['chat/lastReaction'](props.transaction.id, partnerId.value, store.state.address)
)
const partnerReaction = computed(() =>
  isSelfChat.value
    ? null
    : store.getters['chat/lastReaction'](props.transaction.id, partnerId.value, partnerId.value)
)

const displayMyReaction = computed(() => myReaction.value && !isEmptyReaction(myReaction.value))
const displayPartnerReaction = computed(
  () => partnerReaction.value && !isEmptyReaction(partnerReaction.value)
)

const reactions = computed(() => {
  const list = []

  if (displayMyReaction.value) list.push(myReaction.value)
  if (displayPartnerReaction.value) list.push(partnerReaction.value)

  return list.sort((left, right) => left.timestamp - right.timestamp)
})

watch(
  () => store.getters['chat/numOfNewMessages'](partnerId.value),
  (numOfNewMessages) => {
    if (numOfNewMessages > 0) vibrate.veryShort()
  },
  { immediate: true }
)
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.a-chat-reactions {
  position: absolute;
  display: flex;
  flex-direction: row;
  border-radius: var(--a-radius-sm);
  padding: calc(var(--a-space-1) / 2);

  bottom: 0;

  right: 100%;
  margin-right: calc(var(--a-space-1) * -1);
  margin-bottom: calc(var(--a-space-1) * -1);

  cursor: default;
  user-select: none;

  &--left {
    right: unset;
    left: 100%;
    margin-right: unset;
    margin-left: calc(var(--a-space-1) * -1);
  }

  &__reaction {
    & ~ & {
      margin-left: var(--a-space-1);
    }
  }
}

.v-theme--light {
  .a-chat-reactions {
    background-color: map.get(colors.$adm-colors, 'secondary');
  }
}

.v-theme--dark {
  .a-chat-reactions {
    background-color: map.get(colors.$adm-colors, 'secondary2-slightly-transparent');
  }
}
</style>
