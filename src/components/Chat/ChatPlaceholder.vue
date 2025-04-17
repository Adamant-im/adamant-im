<template>
  <div v-if="showPlaceholder || isGettingPublicKey || isKeyMissing" :class="classes.root">
    <div v-if="showPlaceholder && !isKeyMissing" :class="classes.container">
      <Logo style="width: 35px" />
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
        {{ t('chats.placeholder.key-missing') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Logo from '@/components/icons/common/Logo.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  showPlaceholder: boolean
  isGettingPublicKey: boolean
  isKeyMissing: boolean
}>()

const className = 'chat-placeholder'
const classes = {
  root: className,
  row: `${className}__row`,
  container: `${className}__container`,
  spinner: `${className}__spinner`
}
const keys = ['encrypted', 'ipfs', 'anonymous', 'censorship']
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.chat-placeholder {
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  width: 100%;
  padding: 8px 0;
  margin: 16px 0;

  &__container {
    margin: auto;
    display: flex;
    width: fit-content;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    row-gap: 5px;
    padding: 16px;
    background: map.get(colors.$adm-colors, 'black');
    border-radius: 8px;

    &_public-key {
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
}

/** Themes **/
.v-theme--light {
  .chat-placeholder {
    &__container {
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
      background-color: map.get(colors.$adm-colors, 'black');
      box-shadow:
        0 1px 10px hsla(0, 0%, 39.2%, 0.06),
        0 1px 1px hsla(0, 0%, 39.2%, 0.04),
        0 2px 10px -1px hsla(0, 0%, 39.2%, 0.02);
    }

    &__spinner {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
