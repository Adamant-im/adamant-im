<template>
  <div class="a-chat">
    <div class="a-chat__content">
      <slot name="header" />

      <v-divider />

      <div class="a-chat__body">
        <div class="text-center py-2">
          <v-progress-circular
            v-show="loading"
            indeterminate
            color="primary"
            size="24"
            style="z-index: 100"
          />
        </div>

        <div ref="messagesRef" class="a-chat__body-messages">
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

        <div class="a-chat__fab">
          <slot name="fab" />
        </div>
      </div>

      <slot name="form" />
    </div>

    <div v-if="$slots.overlay" class="a-chat__overlay">
      <slot name="overlay" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import throttle from 'lodash/throttle'
import scrollIntoView from 'scroll-into-view-if-needed'
import Styler from 'stylefire'
import { animate } from 'popmotion'
import { SCROLL_TO_REPLIED_MESSAGE_ANIMATION_DURATION } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import { isWelcomeChat } from '@/lib/chat/meta/utils/isWelcomeChat'

export default {
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    partners: {
      type: Array,
      default: () => []
    },
    userId: {
      type: String
    },
    loading: {
      type: Boolean,
      default: false
    },
    locale: {
      type: String,
      default: 'en'
    }
  },
  emits: ['scroll', 'scroll:bottom', 'scroll:top'],
  setup(props, { emit }) {
    const messagesRef = ref(null)
    const currentScrollHeight = ref(0)
    const currentScrollTop = ref(0)
    const currentClientHeight = ref(0)
    const resizeObserver = ref(null)

    const isWelcome = computed(() => {
      return props.partners
        .map((item) => item.id)
        .map(isWelcomeChat)
        .reduce((previous, current) => previous || current, false)
    })

    const emitScroll = throttle(function () {
      emit('scroll', currentScrollTop.value, isScrolledToBottom())
    }, 200)

    const attachScrollListener = () => {
      messagesRef.value.addEventListener('scroll', onScroll)
    }

    const destroyScrollListener = () => {
      messagesRef.value.removeEventListener('scroll', onScroll)
    }

    const onScroll = () => {
      const scrollHeight = messagesRef.value.scrollHeight
      const scrollTop = Math.ceil(messagesRef.value.scrollTop)
      const clientHeight = messagesRef.value.clientHeight

      if (scrollHeight - scrollTop === clientHeight) {
        emit('scroll:bottom')
      } else if (scrollTop === 0) {
        currentScrollHeight.value = scrollHeight
        emit('scroll:top')
      }

      currentScrollTop.value = scrollTop
      currentScrollHeight.value = scrollHeight

      emitScroll()
    }

    const maintainScrollPosition = () => {
      if (isWelcome.value) {
        messagesRef.value.scrollTop = 0
      } else {
        messagesRef.value.scrollTop =
          messagesRef.value.scrollHeight - currentScrollHeight.value + currentScrollTop.value
      }
    }

    const scrollToBottom = () => {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }

    const scrollTo = (position) => {
      messagesRef.value.scrollTop = position
    }

    const scrollToMessage = (index) => {
      const elements = messagesRef.value.children

      if (!elements) return

      const element = elements[elements.length - 1 - index]

      if (element) {
        messagesRef.value.scrollTop = element.offsetTop - 16
      } else {
        scrollToBottom()
      }
    }

    const scrollToMessageEasy = (index) => {
      const elements = messagesRef.value.children

      if (!elements) return Promise.resolve(false)

      const element = elements[elements.length - 1 - index]

      if (!element) return Promise.resolve(false)

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
      const scrollOffset =
        messagesRef.value.scrollHeight -
        Math.ceil(messagesRef.value.scrollTop) -
        messagesRef.value.clientHeight

      return scrollOffset <= 60
    }

    const getSenderMeta = (senderId) => {
      return props.partners.find((partner) => isStringEqualCI(partner.id, senderId))
    }

    onMounted(() => {
      attachScrollListener()

      currentClientHeight.value = messagesRef.value.clientHeight
      const resizeHandler = () => {
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

      resizeObserver.value = new ResizeObserver(resizeHandler)
      resizeObserver.value.observe(messagesRef.value)
    })

    onBeforeUnmount(() => {
      destroyScrollListener()
      resizeObserver.value?.unobserve(messagesRef.value)
    })

    return {
      messagesRef,
      maintainScrollPosition,
      scrollToBottom,
      scrollTo,
      scrollToMessage,
      scrollToMessageEasy,
      getSenderMeta,
      isScrolledToBottom
    }
  }
}
</script>
