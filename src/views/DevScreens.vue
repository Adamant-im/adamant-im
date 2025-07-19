<template>
  <h3 :class="`${className}__title a-text-caption`" class="mt-4 mb-4">
    {{ t('dev_screens.title') }}
  </h3>

  <v-row no-gutters>
    <v-col cols="12">
      <v-list class="dev-list">
        <v-list-item
          :title="t('dev_screens.vibrations')"
          :append-icon="mdiChevronRight"
          @click="router.push({ name: 'DevVibrations' })"
        />

        <v-list-item
          :title="t('dev_screens.adamant_wallets')"
          :append-icon="mdiChevronRight"
          @click="router.push({ name: 'DevAdamantWallets' })"
        />
      </v-list>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { mdiChevronRight } from '@mdi/js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const className = 'dev-screens-view'
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.dev-screens-view {
  &__title {
    padding-top: 15px;
    margin-left: -24px;
    margin-right: -24px;
    padding-left: 24px;
    padding-right: 24px;
  }

  .dev-list {
    margin-left: -24px;
    margin-right: -24px;

    :deep(.v-list-item) {
      padding-inline-start: 24px;
      padding-inline-end: 24px;
    }
  }
}

/** Themes **/
.v-theme--light {
  .dev-screens-view {
    &__title {
      background-color: map.get(colors.$adm-colors, 'secondary2-transparent');
      color: map.get(colors.$adm-colors, 'regular');
    }

    .v-divider {
      border-color: map.get(colors.$adm-colors, 'secondary2');
    }
  }
}

/** Breakpoints **/
@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .dev-screens-view {
    &__title {
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 16px;
      padding-right: 16px;
    }

    .dev-list {
      margin-left: -16px;
      margin-right: -16px;

      :deep(.v-list-item) {
        padding-inline-start: 16px;
        padding-inline-end: 16px;
      }
    }
  }
}
</style>
