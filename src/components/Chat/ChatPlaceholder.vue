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
        <v-progress-circular :class="classes.spinner" indeterminate :size="20" />
        {{ t('chats.placeholder.public-key') }}
      </div>
      <div v-else>
        <p>{{ t('chats.placeholder.can_not_message') }}</p>
        <a class="a-text-active" @click="openLink">
          {{ t('chats.placeholder.what_does_it_mean.text') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

type Props = {
  showPlaceholder: boolean
  isGettingPublicKey: boolean
  isKeyMissing: boolean
}

defineProps<Props>()

const logo = '/img/adamant-logo-transparent-512x512.png'
const className = 'chat-placeholder'
const classes = {
  root: className,
  row: `${className}__row`,
  container: `${className}__container`,
  spinner: `${className}__spinner`,
  logo: `${className}__logo`
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
@use 'vuetify/settings';

.chat-placeholder {
  display: flex;
  flex-direction: column;
  row-gap: 16px;
  width: 100%;
  margin-bottom: 16px;

  &__container {
    margin: auto;
    display: flex;
    flex-direction: column;
    height: chat.$placeholder-height;
    justify-content: flex-start;
    align-items: center;
    row-gap: 5px;
    padding: 16px;
    background: map.get(colors.$adm-colors, 'black');
    border-radius: 8px;

    &_public-key {
      height: auto;
      flex-direction: row;
      column-gap: 8px;
    }
  }

  &__spinner {
    margin-bottom: 4px;
    margin-right: 4px;
  }

  &__row {
    width: 100%;
    text-align: center;
  }

  &__logo {
    width: 100px;
    height: 100px;
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

      background: #fff;
      box-shadow:
        0 1px 10px hsla(0, 0%, 39.2%, 0.06),
        0 1px 1px hsla(0, 0%, 39.2%, 0.04),
        0 2px 10px -1px hsla(0, 0%, 39.2%, 0.02);
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

      background-color: map.get(colors.$adm-colors, 'black');
      box-shadow:
        0 1px 10px hsla(0, 0%, 39.2%, 0.06),
        0 1px 1px hsla(0, 0%, 39.2%, 0.04),
        0 2px 10px -1px hsla(0, 0%, 39.2%, 0.02);
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
