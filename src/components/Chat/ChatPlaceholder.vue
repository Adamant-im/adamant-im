<template>
  <div :class="className">
    <div :class="`${className}__container`">
      <Logo style="width: 35px" />
      <p v-for="key in keys" :key="key" :class="`${className}__row`">
        {{ $t(`chats.placeholder.${key}`) }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Logo from '@/components/icons/common/Logo.vue'

const className = 'chat-placeholder'
const keys = ['encrypted', 'ipfs', 'anonymous', 'censorship']
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.chat-placeholder {
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
  }
}
</style>
