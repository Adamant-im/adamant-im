<template>
  <div :class="className">
    <v-list subheader class="pa-0" bg-color="transparent" v-if="isFulfilled">
      <v-row :class="`${className}__chats-actions`" no-gutters>
        <v-btn
          :class="`${className}__btn mt-2 ml-4`"
          @click="markAllAsRead"
          v-if="unreadMessagesCount > 0"
          :icon="mdiCheckAll"
          size="small"
          variant="text"
        />
        <v-progress-circular
          :class="`${className}__connection-spinner mt-4 ml-6`"
          v-show="showSpinner"
          indeterminate
          :size="24"
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
        :class="{
          [`${className}__messages`]: true,
          [`${className}__messages--chat`]: true
        }"
        @scroll="onScroll"
      >
        <template v-for="(transaction, index) in lastMessages" :key="transaction.contactId">
          <chat-preview
            v-if="displayChat(transaction.contactId)"
            :ref="transaction.contactId"
            :is-loading-separator="index === separatorIndex"
            :is-loading-separator-active="loading"
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

    <div
      class="d-flex justify-center align-center"
      :class="`${className}__chat-spinner-wrapper`"
      v-if="!isFulfilled"
    >
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
import { mdiMessageOutline, mdiCheckAll } from '@mdi/js'
import { useRoute, useRouter } from 'vue-router'
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch
} from 'vue'
import { useChatStateStore } from '@/stores/modal-state'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useChatsSpinner } from '@/hooks/useChatsSpinner'
import { computedEager } from '@vueuse/core'

const scrollOffset = 64

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

onActivated(() => {
  if (savedRoute.value) {
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
})

onBeforeUnmount(() => {
  destroyScrollListener()
})

watch(chatPagePartnerId, (value) => {
  if (value) {
    lastPartnerId.value = value
  }

  if (!value && route.name === 'Chats') {
    savedRoute.value = null
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

const loadChatsPaged = () => {
  if (loading.value || noMoreChats.value) return

  loading.value = true
  store.dispatch('chat/loadChatsPaged').finally(() => {
    loading.value = false
  })
}

const messagesCount = (partnerId: string) => {
  const messages = store.getters['chat/messages'](partnerId)

  return messages.length
}

const displayChat = (partnerId: string) => {
  const isUserChat = !isAdamantChat(partnerId)
  const ifChattedBefore = isAdamantChat(partnerId) && messagesCount(partnerId) > 1

  return isUserChat || isStaticChat(partnerId) || ifChattedBefore
}

const markAllAsRead = () => {
  store.commit('chat/markAllAsRead')
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.chats-view {
  height: 100%;

  &.a-container,
  :deep(.a-container) {
    max-width: 1300px;
  }

  &__item {
    justify-content: flex-end;
    height: 56px;
    min-height: 56px;

    & :deep(.v-list-item__avatar) {
      margin-right: 4px;
    }

    :deep(.v-list-item__prepend) {
      > .v-icon {
        margin-inline-end: 8px;
      }
    }
  }
  &__chats-actions {
    margin: 0;
  }
  &__title {
    font-weight: 300;
    font-size: 14px;
  }
  &__container--chat {
    max-width: 1300px;

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      display: none;
    }
  }
  &__messages {
    &.chats-view__messages--chat {
      max-height: calc(100vh - 56px - var(--v-layout-bottom));
      overflow-y: auto;
    }
  }

  &__chat-spinner-wrapper {
    position: relative;
    height: 100%;
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
  transition: transform 0.5s;
}
</style>
