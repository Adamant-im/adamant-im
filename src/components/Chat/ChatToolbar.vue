<template>
  <v-toolbar flat :class="`${className}`" color="transparent">
    <back-button @click="goBack" v-if="isMobileView">
      <v-badge
        v-if="numOfNewMessages > 0"
        :value="numOfNewMessages"
        color="primary"
        :class="`${className}__messages-counter`"
        :content="messagesCounterContent"
      >
      </v-badge>
    </back-button>
    <div v-if="!isWelcomeChat(partnerId)">
      <slot name="avatar-toolbar" />
    </div>
    <div :class="`${className}__textfield-container`">
      <div v-if="isWelcomeChat(partnerId)" :class="`${className}__adm-chat-name`">
        {{ t('chats.virtual.welcome_message_title') }}
      </div>
      <div v-else>
        <v-text-field
          v-model="partnerName"
          :class="`${className}__textfield`"
          variant="plain"
          background-color="transparent"
          :label="partnerId"
          hide-details
          density="compact"
          :readonly="isAdamantChat(partnerId)"
        />
      </div>
    </div>

    <v-spacer />
  </v-toolbar>
</template>

<script setup lang="ts">
import { useScreenSize } from '@/hooks/useScreenSize'
import BackButton from '@/components/common/BackButton/BackButton.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { isAdamantChat, isWelcomeChat } from '@/lib/chat/meta/utils'
import { useI18n } from 'vue-i18n'
import { useChatName } from '@/components/AChat/hooks/useChatName'
import { CHAT_TOOLBAR_UNREAD_COUNTER_MAX } from './helpers/uiMetrics'

const { partnerId } = defineProps({
  partnerId: {
    type: String,
    required: true
  }
})

const className = 'chat-toolbar'

const store = useStore()
const router = useRouter()
const { t } = useI18n()

const { isMobileView } = useScreenSize()

const name = useChatName(partnerId)

const partnerName = computed({
  get: () => name.value,
  set(value) {
    store.commit('partners/displayName', {
      partner: partnerId,
      displayName: value
    })
  }
})

const numOfNewMessages = computed(() => store.getters['chat/numWithoutTheCurrentChat'](partnerId))
const messagesCounterContent = computed(() => {
  return numOfNewMessages.value > CHAT_TOOLBAR_UNREAD_COUNTER_MAX
    ? `${CHAT_TOOLBAR_UNREAD_COUNTER_MAX}+`
    : numOfNewMessages.value
})

const goBack = () => {
  router.push({ name: 'Chats' })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use '@/assets/styles/generic/_variables.scss';
@use 'vuetify/settings';

.chat-toolbar {
  --a-chat-toolbar-padding-inline-start: var(--a-space-3);
  --a-chat-toolbar-content-gap: var(--a-space-2);
  --a-chat-toolbar-content-padding-inline-end: var(--a-space-3);
  --a-chat-toolbar-content-padding-inline-end-mobile: var(--a-space-2);
  --a-chat-toolbar-counter-offset-top: calc((var(--a-space-3) + (var(--a-space-1) / 2)) * -1);
  --a-chat-toolbar-counter-offset-left: calc(var(--a-space-1) / -2);
  --a-chat-toolbar-adm-name-letter-spacing: 0.02em;
  --a-chat-toolbar-label-font-size: var(--a-font-size-md);
  --a-chat-toolbar-input-padding-top: var(--a-space-5);
  --a-chat-toolbar-input-font-weight: 500;
  --a-chat-toolbar-floating-label-font-size: var(--a-space-5);
  --a-chat-toolbar-floating-label-offset-y: calc(var(--a-space-3) / -2);
  --a-chat-toolbar-floating-label-scale: 0.6875;

  flex-grow: 0;
  flex-shrink: 0;
  padding-inline-start: var(--a-chat-toolbar-padding-inline-start);

  :deep(.v-toolbar__content) {
    min-height: var(--toolbar-height) !important;
    height: var(--toolbar-height) !important;
    gap: var(--a-chat-toolbar-content-gap);
    padding-inline-end: var(--a-chat-toolbar-content-padding-inline-end);
  }

  @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
    padding-inline-start: 0;

    :deep(.v-toolbar__content) {
      padding-inline-end: var(--a-chat-toolbar-content-padding-inline-end-mobile);
    }
  }

  &__messages-counter {
    position: relative;
    top: var(--a-chat-toolbar-counter-offset-top);
    left: var(--a-chat-toolbar-counter-offset-left);
  }
  &__textfield-container {
    width: 100%;
    min-width: 0;
  }

  &__adm-chat-name {
    @include mixins.a-text-header();
    letter-spacing: var(--a-chat-toolbar-adm-name-letter-spacing);
  }

  &__textfield {
    // hides TextField border bottom
    :deep(.v-input__control) {
      & > .v-input__slot:before {
        border-width: 0;
        border-color: unset;
      }

      & > .v-input__slot:after {
        border-width: 0;
        background-color: unset;
        border-color: unset;
      }
    }
  }

  :deep(.v-text-field) {
    @include mixins.a-text-regular-enlarged-bold();

    .v-field__field {
      .v-label.v-field-label {
        max-width: unset;
        @include mixins.a-text-regular-enlarged-bold();
        font-size: var(--a-chat-toolbar-label-font-size);
      }
    }

    .v-field__input {
      line-height: var(--a-line-height-sm);
      padding-top: var(--a-chat-toolbar-input-padding-top);
      font-weight: var(--a-chat-toolbar-input-font-weight);
    }

    .v-field__outline {
      .v-label.v-field-label.v-field-label--floating {
        line-height: var(--a-line-height-sm);
        font-size: var(--a-chat-toolbar-floating-label-font-size);
        transform: translateY(var(--a-chat-toolbar-floating-label-offset-y))
          scale(var(--a-chat-toolbar-floating-label-scale));
        font-weight: var(--a-chat-toolbar-input-font-weight);
      }
    }

    .v-input__control {
      padding: 0;
    }

    .v-input__control > .v-input__slot {
      margin-bottom: 0;
    }
  }
}

/** Themes **/
.v-theme--light {
  .chat-toolbar {
    background-color: map.get(colors.$adm-colors, 'secondary2-transparent');

    :deep(.v-text-field) {
      .primary--text {
        color: map.get(settings.$grey, 'darken-1') !important;
      }
      .v-label {
        color: map.get(settings.$grey, 'darken-4');
      }
      .v-label--active {
        color: map.get(settings.$grey, 'darken-1');
      }
      input {
        caret-color: map.get(colors.$adm-colors, 'primary2');
      }
    }
  }
}
.v-theme--dark {
  .chat-toolbar {
    :deep(.v-text-field) {
      .primary--text {
        color: map.get(settings.$shades, 'white') !important;
      }
      .v-label {
        color: map.get(settings.$shades, 'white');
      }
      .v-label--active {
        color: map.get(settings.$shades, 'white');
      }
      input {
        caret-color: map.get(colors.$adm-colors, 'primary');
      }
    }
  }
}
</style>
