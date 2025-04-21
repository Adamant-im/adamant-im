<template>
  <v-row justify="center" :class="className" no-gutters>
    <container>
      <v-row no-gutters>
        <v-col cols="12">
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
              <v-btn
                :class="`${className}__item`"
                @click="showChatStartDialog = true"
                variant="plain"
              >
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
            <transition-group name="messages">
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
                  @click="openChat(transaction.contactId)"
                />
              </template>
            </transition-group>
          </v-list>
        </v-col>

        <ChatSpinner :value="!isFulfilled" />
      </v-row>
    </container>

    <chat-start-dialog
      v-model="showChatStartDialog"
      :partner-id="partnerId"
      @error="onError"
      @start-chat="openChat"
    />

    <NodesOfflineDialog node-type="adm" />
  </v-row>
</template>

<script lang="ts" setup>
import ChatPreview from '@/components/ChatPreview.vue'
import ChatStartDialog from '@/components/ChatStartDialog.vue'
import ChatSpinner from '@/components/ChatSpinner.vue'
import NodesOfflineDialog from '@/components/NodesOfflineDialog.vue'
import { getAdamantChatMeta, isAdamantChat, isStaticChat } from '@/lib/chat/meta/utils'
import { mdiMessageOutline, mdiCheckAll } from '@mdi/js'
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatsSpinner } from '@/hooks/useChatsSpinner'

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

const scrollOffset = 64
const className = 'chats-view'

const showChatStartDialog = ref(false)
const loading = ref(false)
const noMoreChats = ref(false)
const loadingSeparator = ref<InstanceType<typeof ChatPreview>[]>([])

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

onBeforeMount(() => {
  noMoreChats.value = store.getters['chat/chatListOffset'] === -1
})

onMounted(() => {
  showChatStartDialog.value = props.showNewContact
  attachScrollListener()
})

onBeforeUnmount(() => {
  destroyScrollListener()
})

function openChat(partnerId: string, messageText?: string) {
  router.push({
    name: 'Chat',
    params: { partnerId },
    query: { messageText }
  })
}

function onError(message: string) {
  store.dispatch('snackbar/show', { message })
}

function attachScrollListener() {
  window.addEventListener('scroll', onScroll)
}

function destroyScrollListener() {
  window.removeEventListener('scroll', onScroll)
}

function onScroll() {
  const scrollHeight = document.documentElement.scrollHeight // all of viewport height
  const scrollTop = document.documentElement.scrollTop // current vieport scroll position
  const clientHeight = document.documentElement.clientHeight

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

function loadChatsPaged() {
  if (loading.value || noMoreChats.value) return

  loading.value = true
  store
    .dispatch('chat/loadChatsPaged')
    .catch(() => {
      noMoreChats.value = true
    })
    .finally(() => {
      loading.value = false
      onScroll() // update messages and remove loadingSeparator, if needed
    })
}

function messagesCount(partnerId: string) {
  const messages = store.getters['chat/messages'](partnerId)

  return messages.length
}

function displayChat(partnerId: string) {
  const isUserChat = !isAdamantChat(partnerId)
  const ifChattedBefore = isAdamantChat(partnerId) && messagesCount(partnerId) > 1

  return isUserChat || isStaticChat(partnerId) || ifChattedBefore
}

function markAllAsRead() {
  store.commit('chat/markAllAsRead')
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.chats-view {
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
