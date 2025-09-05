<template>
  <div :class="classes.root">
    <div :class="classes.content">
      <slot name="header" />

      <v-divider />

      <div :class="classes.body" ref="bodyRef">
        <div
          v-show="loading && !isWelcomeChat(partnerId)"
          :class="classes.spinnerWrapper"
          :style="{ top: spinnerTop + 'px' }"
        >
          <v-progress-circular indeterminate :size="20" :class="classes.spinner" />
        </div>

        <div ref="messagesRef" :class="classes.bodyMessages">
          <div ref="placeholderRef">
            <slot name="placeholder" />
          </div>

          <template v-for="message in messages" :key="message.id">
            <slot
              name="message"
              :message="message"
              :sender="getSenderMeta(message.senderId)"
              :user-id="userId"
              :locale="locale"
            />
          </template>
        </div>

        <div :class="classes.fab">
          <slot name="fab" />
        </div>
      </div>

      <slot name="form" />
    </div>

    <div v-if="$slots.overlay" :class="classes.overlay">
      <slot name="overlay" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  withDefaults,
  defineProps,
  defineEmits
} from 'vue'
import throttle from 'lodash/throttle'
import scrollIntoView from 'scroll-into-view-if-needed'
import Styler from 'stylefire'
import { animate } from 'popmotion'
import { SCROLL_TO_REPLIED_MESSAGE_ANIMATION_DURATION } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { User } from '@/components/AChat/types'
import { isWelcomeChat } from '@/lib/chat/meta/utils'

const className = 'a-chat'
const classes = {
  root: className,
  content: `${className}__content`,
  body: `${className}__body`,
  bodyMessages: `${className}__body-messages`,
  fab: `${className}__fab`,
  overlay: `${className}__overlay`,
  spinner: `${className}__spinner`,
  spinnerWrapper: `${className}__spinner-wrapper`
}

type Props = {
  messages: NormalizedChatMessageTransaction[]
  showNewChatPlaceholder: boolean
  isGettingPublicKey: boolean
  partners: User[]
  userId: string
  loading: boolean
  locale: string
  partnerId: string
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
  showNewChatPlaceholder: false,
  partners: () => [],
  loading: false,
  locale: 'en',
  partnerId: ''
})

const emit = defineEmits<{
  (e: 'scroll', scrollPosition: number, isBottom: boolean): void
  (e: 'scroll:bottom'): void
  (e: 'scroll:top'): void
}>()

const messagesRef = ref<HTMLElement | null>(null)
const placeholderRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)

const currentScrollHeight = ref(0)
const currentScrollTop = ref(0)
const currentClientHeight = ref(0)

const placeholderHeight = ref(0)
const scrollTop = ref(0)

const resizeHandler = () => {
  if (!messagesRef.value) return

  const clientHeightDelta = currentClientHeight.value - messagesRef.value.clientHeight

  const nonVisibleClientHeight =
    messagesRef.value.scrollHeight -
    messagesRef.value.clientHeight -
    Math.ceil(messagesRef.value.scrollTop)
  const scrolledToBottom = nonVisibleClientHeight === 0

  if (!scrolledToBottom) {
    messagesRef.value.scrollTop += clientHeightDelta
  }

  currentClientHeight.value = messagesRef.value.clientHeight
}

const resizeObserver = ref(new ResizeObserver(resizeHandler))

const emitScroll = throttle(() => emit('scroll', currentScrollTop.value, isScrolledToBottom()), 200)

const onScroll = () => {
  if (!messagesRef.value) return

  const scrollHeight = messagesRef.value.scrollHeight
  const scrollTopVal = Math.ceil(messagesRef.value.scrollTop)
  const clientHeight = messagesRef.value.clientHeight

  if (scrollHeight - scrollTopVal === clientHeight) {
    emit('scroll:bottom')
  } else if (scrollTopVal === 0) {
    currentScrollHeight.value = scrollHeight
    emit('scroll:top')
  }

  currentScrollTop.value = scrollTopVal
  currentScrollHeight.value = scrollHeight

  scrollTop.value = scrollTopVal

  emitScroll()
}

const maintainScrollPosition = () => {
  if (!messagesRef.value) return

  messagesRef.value.scrollTop =
    messagesRef.value.scrollHeight - currentScrollHeight.value + currentScrollTop.value
}

const scrollToBottom = () => {
  if (messagesRef.value && messagesRef.value.scrollHeight) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const scrollTo = (position: number) => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = position
  }
}

const scrollToMessage = (index: number) => {
  if (!messagesRef.value) return

  const elements = messagesRef.value.children
  const element = elements[elements.length - 1 - index] as HTMLElement

  if (element) {
    messagesRef.value.scrollTop = element.offsetTop - 16
  } else {
    scrollToBottom()
  }
}

const scrollToMessageEasy = async (index: number): Promise<boolean> => {
  if (!messagesRef.value) return false

  const elements = messagesRef.value.children
  const element = elements[elements.length - 1 - index] as HTMLElement

  if (!element) return false

  return new Promise((resolve) => {
    scrollIntoView(element, {
      behavior: (instructions) => {
        const [{ el, top }] = instructions
        const styler = Styler(el)

        if (el.scrollTop === top) {
          resolve(false)
          return
        }

        animate({
          from: el.scrollTop,
          to: top,
          duration: SCROLL_TO_REPLIED_MESSAGE_ANIMATION_DURATION,
          onUpdate: (top) => styler.set('scrollTop', top),
          onComplete: () => resolve(true)
        })
      },
      block: 'center'
    })
  })
}

const isScrolledToBottom = () => {
  if (!messagesRef.value) return false

  const offset =
    messagesRef.value.scrollHeight -
    Math.ceil(messagesRef.value.scrollTop) -
    messagesRef.value.clientHeight

  return offset <= 60
}

const getSenderMeta = (senderId: string) => {
  return props.partners.find((p) => isStringEqualCI(p.id, senderId))
}

onMounted(() => {
  messagesRef.value?.addEventListener('scroll', onScroll)
  if (messagesRef.value) {
    currentClientHeight.value = messagesRef.value.clientHeight
    resizeObserver.value.observe(messagesRef.value)
  }

  const updatePlaceholderHeight = () => {
    placeholderHeight.value = placeholderRef.value?.clientHeight || 0
  }
  updatePlaceholderHeight()
  if (placeholderRef.value) {
    new ResizeObserver(updatePlaceholderHeight).observe(placeholderRef.value)
  }
})

onBeforeUnmount(() => {
  messagesRef.value?.removeEventListener('scroll', onScroll)
  if (messagesRef.value) {
    resizeObserver.value.unobserve(messagesRef.value)
  }
})

defineExpose({
  scrollToBottom,
  isScrolledToBottom,
  scrollToMessageEasy,
  maintainScrollPosition,
  scrollToMessage,
  scrollTo
})

const spinnerTop = computed(() => {
  if (
    (props.showNewChatPlaceholder || props.isGettingPublicKey) &&
    scrollTop.value < placeholderHeight.value + 12
  ) {
    return placeholderHeight.value - scrollTop.value + 48
  }
  return 36
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/components/_chat.scss';
@use 'vuetify/settings';

.a-chat {
  &__body {
    position: relative;
  }

  &__body-messages {
    overflow-y: auto;
  }

  &__spinner-wrapper {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 100;
  }
}

/** Themes **/
.v-theme--light {
  .a-chat {
    &__spinner {
      color: map.get(colors.$adm-colors, 'grey');
    }
  }
}

.v-theme--dark {
  .a-chat {
    &__spinner {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
