<template>
  <div v-if="showPlaceholder || isGettingPublicKey || isKeyMissing" :class="classes.root">
    <div v-if="showPlaceholder && !isKeyMissing" :class="classes.container">
      <img :src="logo" :class="classes.logo" alt="logo" />
      <p v-for="key in keys" :key="key" :class="classes.row">
        {{ t(`chats.placeholder.${key}`) }}
      </p>
    </div>
    <div
      v-if="isGettingPublicKey || isKeyMissing"
      :class="[classes.container, `${classes.container}_public-key`]"
    >
      <div v-if="!isKeyMissing">
        <v-progress-circular
          :class="classes.spinner"
          indeterminate
          :size="CHAT_PLACEHOLDER_PUBLIC_KEY_SPINNER_SIZE"
        />
        {{ t('chats.placeholder.public-key') }}
      </div>
      <div v-else>
        <p>{{ t('chats.placeholder.can_not_message') }}</p>
        <a :class="classes.link" @click="openLink">
          {{ t('chats.placeholder.what_does_it_mean.text') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { joinUrl } from '@/lib/urlFormatter'

const CHAT_PLACEHOLDER_PUBLIC_KEY_SPINNER_SIZE = 20
const { t } = useI18n()

type Props = {
  showPlaceholder: boolean
  isGettingPublicKey: boolean
  isKeyMissing: boolean
}

defineProps<Props>()
const logo = joinUrl(import.meta.env.BASE_URL, '/img/adamant-logo-transparent-512x512.png')
const className = 'chat-placeholder'
const classes = {
  root: className,
  row: `${className}__row`,
  container: `${className}__container`,
  spinner: `${className}__spinner`,
  logo: `${className}__logo`,
  link: `${className}__link`
}
const keys = ['encrypted', 'ipfs', 'anonymous', 'censorship']

function openLink() {
  const link = t('chats.placeholder.what_does_it_mean.link')
  window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/components/_chat.scss';
@use '@/assets/styles/generic/_variables.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.chat-placeholder {
  display: flex;
  flex-direction: column;
  row-gap: var(--a-space-4);
  width: 100%;
  margin-bottom: var(--a-space-4);

  &__container {
    margin: auto;
    display: flex;
    flex-direction: column;
    height: auto;
    justify-content: flex-start;
    align-items: center;
    row-gap: var(--a-space-1);
    padding: var(--a-space-4);
    padding-bottom: var(--a-space-6);
    border: var(--a-border-width-thin) solid transparent;
    border-radius: var(--a-radius-sm);
    @include mixins.a-surface-elevation-soft();

    &_public-key {
      height: auto;
      flex-direction: row;
      column-gap: var(--a-space-2);
    }

    p {
      margin: 0;
    }
  }

  &__spinner {
    margin-bottom: var(--a-space-1);
    margin-right: var(--a-space-1);
  }

  &__row {
    width: 100%;
    text-align: center;

    @media (min-width: #{map.get(variables.$breakpoints, 'mobile') + 1px}) {
      padding-inline: var(--a-screen-padding-inline);
    }
  }

  &__logo {
    width: var(--a-chat-placeholder-logo-size);
    height: var(--a-chat-placeholder-logo-size);
  }

  &__link {
    @include mixins.a-text-active();
  }
}

/** Themes **/
.v-theme--light {
  .chat-placeholder {
    &__container {
      color: map.get(colors.$adm-colors, 'regular');

      a {
        color: map.get(settings.$blue, 'base');
      }

      background-color: map.get(colors.$adm-colors, 'light-gray');
      border-color: map.get(colors.$adm-colors, 'light-gray2');
    }

    &__spinner {
      color: map.get(colors.$adm-colors, 'grey');
    }
  }
}

.v-theme--dark {
  .chat-placeholder {
    &__container {
      a {
        color: map.get(settings.$blue, 'lighten-2');
      }

      background-color: map.get(colors.$adm-colors, 'black3');
      border-color: map.get(colors.$adm-colors, 'black4');
    }

    &__spinner {
      color: map.get(colors.$adm-colors, 'regular');
    }

    &__logo {
      filter: invert(1);
      mix-blend-mode: lighten;
    }
  }
}
</style>
