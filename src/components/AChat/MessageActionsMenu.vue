<template>
  <v-menu
    v-model="open"
    location="bottom center"
    :activator="activator"
    :content-class="{
      [classes.vOverlayContentLeft]: position === 'left',
      [classes.vOverlayContentRight]: position === 'right'
    }"
    :min-width="80"
    :max-width="184"
    :offset="16"
    transition="scale-transition"
  >
    <v-list density="compact" variant="text" :class="classes.vList" elevation="9">
      <v-list-item @click="onClickReply">
        <v-list-item-title>{{ t('chats.chat_actions.reply') }}</v-list-item-title>

        <template #append>
          <v-icon icon="mdi-reply" />
        </template>
      </v-list-item>

      <v-divider />

      <v-list-item @click="onClickCopy">
        <v-list-item-title>{{ t('chats.chat_actions.copy') }}</v-list-item-title>

        <template #append>
          <v-icon icon="mdi-content-copy" />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const className = 'message-actions-menu'
const classes = {
  root: className,
  vList: `${className}__list`,
  vOverlayContent: `${className}__overlay-content`,
  vOverlayContentLeft: `${className}__overlay-content--left`,
  vOverlayContentRight: `${className}__overlay-content--right`
}

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    /**
     * Specifies which DOM element the overlay content should teleport to.
     */
    attach: {
      type: Object, // type HTMLElement
      required: false
    },
    messageId: {
      type: String,
      required: true
    },
    position: {
      type: String, // 'left' | 'right',
      required: true
    }
  },
  emits: ['update:modelValue', 'click:reply', 'click:copy'],
  computed: {
    open: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    const activator = computed(() => `.a-chat__message[data-txid='${props.messageId}']`)

    const onClickReply = () => emit('click:reply')
    const onClickCopy = () => emit('click:copy')

    return {
      classes,
      activator,
      t,
      onClickReply,
      onClickCopy
    }
  }
})
</script>

<style lang="scss">
@import '../../assets/styles/components/_chat.scss';

$padding-x: 16px;

.message-actions-menu {
  &__list {
    padding-top: 0;
    padding-bottom: 0;
  }

  &__overlay-content {
    &--left {
      left: $padding-x !important;
    }

    &--right {
      left: unset !important;
      right: $padding-x + $scroll-bar-width;
    }
  }
}
</style>
