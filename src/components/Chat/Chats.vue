<template>
  <div :class="className">
    <v-list subheader :class="`${className}__list`" bg-color="transparent" v-if="isFulfilled">
      <v-row class="v-row--no-gutters" :class="`${className}__chats-actions`">
        <v-btn
          :class="`${className}__mark-read-btn`"
          @click="markAllAsRead"
          v-if="unreadMessagesCount > 0"
          :icon="mdiCheckAll"
          size="small"
          variant="text"
        />
        <v-progress-circular
          :class="`${className}__connection-spinner`"
          v-show="showSpinner"
          indeterminate
          :size="CHATS_CONNECTION_SPINNER_SIZE"
        />
        <v-spacer />
        <v-btn :class="`${className}__item`" @click="setShowChatStartDialog(true)" variant="plain">
          <template #prepend>
            <v-icon :class="`${className}__icon`" :icon="mdiMessageOutline" size="small" />
          </template>

          <div>
            <v-list-item-title :class="`${className}__title`">
              {{ t('chats.new_chat') }}
            </v-list-item-title>
          </div>
        </v-btn>
      </v-row>
      <div
        class="a-scroll-pane"
        :class="{
          [`${className}__messages`]: true,
          [`${className}__messages--chat`]: true
        }"
        @scroll="onScroll"
      >
        <template v-for="(transaction, index) in lastMessages" :key="transaction.contactId">
          <chat-preview
            v-if="displayChat(transaction.contactId)"
            :key="dateRefreshKey"
            :ref="transaction.contactId"
            :is-loading-separator="index === separatorIndex"
            :is-loading-separator-active="loading && areAdmNodesOnline"
            :user-id="userId"
            :contact-id="transaction.contactId"
            :transaction="transaction.lastMessage"
            :is-message-readonly="transaction.lastMessage.readonly"
            :adamant-chat-meta="getAdamantChatMeta(transaction.contactId)"
            :is-active="checkIsActive(transaction.contactId)"
            @click="openChat(transaction.contactId)"
          />
        </template>
      </div>
    </v-list>

    <div :class="`${className}__chat-spinner-wrapper`" v-if="!isFulfilled">
      <ChatSpinner :value="!isFulfilled" />
    </div>

    <chat-start-dialog
      v-model="isShowChatStartDialog"
      :partner-id="partnerId"
      @error="onError"
      @start-chat="openChat"
    />

    <NodesOfflineDialog node-type="adm" />
  </div>
</template>

<script lang="ts" setup>
import ChatPreview from '@/components/ChatPreview.vue'
import ChatStartDialog from '@/components/ChatStartDialog.vue'
import ChatSpinner from '@/components/ChatSpinner.vue'
import NodesOfflineDialog from '@/components/NodesOfflineDialog.vue'
import { getAdamantChatMeta, isAdamantChat, isStaticChat } from '@/lib/chat/meta/utils'
import { shouldDisplayChat } from '@/components/Chat/helpers/chatVisibility'
import { mdiMessageOutline, mdiCheckAll } from '@mdi/js'
import { useRoute, useRouter } from 'vue-router'
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { useChatStateStore } from '@/stores/modal-state'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useChatsSpinner } from '@/hooks/useChatsSpinner'
import { computedEager } from '@vueuse/core'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { isAllNodesOfflineError } from '@/lib/nodes/utils/errors'
import Visibility from 'visibilityjs'
import { CHATS_CONNECTION_SPINNER_SIZE, CHATS_SCROLL_OFFSET } from './helpers/uiMetrics'

const scrollOffset = CHATS_SCROLL_OFFSET

const props = withDefaults(
  defineProps<{
    partnerId?: string
    showNewContact?: boolean
  }>(),
  {
    partnerId: undefined,
    showNewContact: false
  }
)

const store = useStore()
const router = useRouter()
const { t } = useI18n()
const showSpinner = useChatsSpinner()
const route = useRoute()
const chatStateStore = useChatStateStore()

const className = 'chats-view'

const { setShowChatStartDialog } = chatStateStore

const isShowChatStartDialog = computed({
  get: () => chatStateStore.isShowChatStartDialog,
  set: (value) => setShowChatStartDialog(value)
})

const lastPartnerId = ref<string | null>(null)
const savedRoute = ref(null)
const loading = ref(false)
const loadingSeparator = ref<InstanceType<typeof ChatPreview>[]>([])
const allowRetry = ref(false)

const dateRefreshKey = ref(0)
const lastVisibleDate = ref(new Date().toDateString())
const visibilityId = ref<number | boolean | null>(null)

const noMoreChats = computedEager(() => store.getters['chat/chatListOffset'] === -1)
const chatPagePartnerId = computed(() => {
  // We assume partnerId to always be a string
  return route.params.partnerId as string
})
const isFulfilled = computed(() => store.state.chat.isFulfilled)
const lastMessages = computed(() => store.getters['chat/lastMessages'])
const separatorIndex = computed(() => {
  if (!noMoreChats.value && lastMessages.value.length > 25) {
    const lastNotAdamantChat = lastMessages.value
      .map((msg: { contactId: string }) => isAdamantChat(msg.contactId))
      .lastIndexOf(false)

    return lastNotAdamantChat + 1
  }

  return null
})
const userId = computed(() => store.state.address)
const unreadMessagesCount = computed(() => store.getters['chat/totalNumOfNewMessages'])
const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
const areAdmNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))

onActivated(() => {
  if (savedRoute.value && !chatPagePartnerId.value) {
    router.push(savedRoute.value)
  }
})

onDeactivated(() => {
  if (history.state.back.includes('/chats/')) {
    savedRoute.value = history.state.back
  }
})

onMounted(() => {
  setShowChatStartDialog(props.showNewContact)
  attachScrollListener()
  checkDate()
})

onBeforeUnmount(() => {
  destroyScrollListener()
  Visibility.unbind(Number(visibilityId.value))
})

watch(chatPagePartnerId, (value) => {
  if (value) {
    lastPartnerId.value = value
  }

  if (!value && route.name === 'Chats') {
    savedRoute.value = null
  }
})

watch(areAdmNodesOnline, (nodesOnline) => {
  if (nodesOnline && loading.value) {
    loadChatsPaged()
  }
})

const checkIsActive = (contactId: string) => {
  return route.name !== 'Chats' && contactId === lastPartnerId.value
}

const openChat = (
  partnerId: string,
  messageText?: string,
  partnerName?: string,
  retrieveKey = false
) => {
  if (retrieveKey) {
    store.commit('chat/addNewChat', { partnerId, partnerName })
  }

  router.push({
    name: 'Chat',
    params: { partnerId },
    query: { messageText }
  })
}

const onError = (message: string) => {
  store.dispatch('snackbar/show', { message })
}

const attachScrollListener = () => {
  window.addEventListener('scroll', onScroll)
}

const destroyScrollListener = () => {
  window.removeEventListener('scroll', onScroll)
}

const onScroll = (event?: Event) => {
  const target = event?.target

  const elem =
    target instanceof HTMLElement
      ? target
      : target instanceof Document
        ? target.documentElement
        : document.documentElement

  const scrollHeight = elem.scrollHeight
  const scrollTop = elem.scrollTop
  const clientHeight = elem.clientHeight

  let isLoadingSeparatorVisible = false
  if (loadingSeparator.value && loadingSeparator.value[0] && loadingSeparator.value[0].$el) {
    const el = loadingSeparator.value[0].$el
    if (el.offsetTop > 0) {
      // loadingSeparator is visible
      const loadingSeparatorTop = el.offsetTop
      const loadingSeparatorHeight = el.clientHeight // it is nearly about bottom menu height
      isLoadingSeparatorVisible =
        scrollTop + clientHeight > loadingSeparatorTop + loadingSeparatorHeight
    }
  }

  const isScrolledToBottom = scrollHeight - scrollTop - scrollOffset < clientHeight

  if (isLoadingSeparatorVisible || isScrolledToBottom) {
    loadChatsPaged()
  }
}

const loadChatsPaged = async () => {
  if ((loading.value || noMoreChats.value) && !allowRetry.value) return

  loading.value = true
  try {
    await store.dispatch('chat/loadChatsPaged')
    loading.value = false
    allowRetry.value = false
  } catch (err: unknown) {
    if (!isAllNodesOfflineError(err as Error)) {
      loading.value = false
      allowRetry.value = false
      return
    }
    allowRetry.value = true
  }
}

const messagesCount = (partnerId: string) => {
  const messages = store.getters['chat/messages'](partnerId)

  return messages.length
}

const displayChat = (partnerId: string) => {
  return shouldDisplayChat({
    isAdamantChat: isAdamantChat(partnerId),
    isStaticChat: isStaticChat(partnerId),
    messagesCount: messagesCount(partnerId)
  })
}

const markAllAsRead = () => {
  store.commit('chat/markAllAsRead')
}

const checkDate = () => {
  visibilityId.value = Visibility.change((event, state) => {
    if (state === 'visible') {
      const currentDate = new Date().toDateString()

      if (currentDate !== lastVisibleDate.value) {
        dateRefreshKey.value = Date.now()
        lastVisibleDate.value = currentDate
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';
@use '@/assets/styles/generic/_variables.scss';

.chats-view {
  --a-chats-actions-height: var(--toolbar-height);
  --a-chats-actions-padding-inline-start: var(--a-space-3);
  --a-chats-actions-padding-inline-end: var(--a-space-2);
  --a-chats-actions-gap: var(--a-space-2);
  --a-chats-item-padding-inline: var(--a-space-2);
  --a-chats-item-avatar-gap-inline: var(--a-space-1);
  --a-chats-item-icon-gap-inline: var(--a-space-2);
  --a-chats-title-font-weight: 300;
  --a-chats-title-font-size: var(--a-font-size-sm);
  --a-chats-messages-move-duration: var(--a-motion-slow);

  margin-top: var(--a-safe-area-top);
  height: 100%;

  &.a-container,
  :deep(.a-container) {
    max-width: var(--a-layout-max-width);
  }

  &__list {
    padding: 0;
  }

  &__mark-read-btn {
    margin: 0;
  }

  &__connection-spinner {
    margin: 0;
  }

  &__item {
    justify-content: flex-end;
    height: 100%;
    min-height: 100%;
    padding-inline: var(--a-chats-item-padding-inline);

    & :deep(.v-list-item__avatar) {
      margin-right: var(--a-chats-item-avatar-gap-inline);
    }

    :deep(.v-list-item__prepend) {
      > .v-icon {
        margin-inline-end: var(--a-chats-item-icon-gap-inline);
      }
    }
  }
  &__chats-actions {
    margin: 0;
    min-height: var(--a-chats-actions-height);
    height: var(--a-chats-actions-height);
    align-items: center;
    padding-inline-start: var(--a-chats-actions-padding-inline-start);
    padding-inline-end: var(--a-chats-actions-padding-inline-end);
    column-gap: var(--a-chats-actions-gap);
  }
  &__title {
    font-weight: var(--a-chats-title-font-weight);
    font-size: var(--a-chats-title-font-size);
  }
  &__container--chat {
    max-width: var(--a-layout-max-width);

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      display: none;
    }
  }
  &__messages {
    &.chats-view__messages--chat {
      height: calc(var(--a-layout-height) - var(--toolbar-height));
      max-height: calc(var(--a-layout-height) - var(--toolbar-height));

      @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
        height: calc(var(--a-layout-height-safe) - var(--toolbar-height));
        max-height: calc(var(--a-layout-height-safe) - var(--toolbar-height));
      }
    }
  }

  &__chat-spinner-wrapper {
    position: relative;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

/** Themes **/
.v-theme--light {
  .chats-view {
    &__connection-spinner {
      color: map.get(colors.$adm-colors, 'grey');
    }
    &__item {
      background-color: map.get(colors.$adm-colors, 'secondary2-transparent');
    }
    &__title {
      color: map.get(colors.$adm-colors, 'muted');
    }
    &__icon {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .chats-view {
    &__connection-spinner {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__icon {
      color: map.get(settings.$shades, 'white');
    }
  }
}

/** Animations **/
.messages-move {
  transition: transform var(--a-chats-messages-move-duration);
}
</style>
