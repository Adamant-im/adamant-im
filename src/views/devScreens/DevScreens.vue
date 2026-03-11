<template>
  <h3 :class="[`${className}__title`, 'a-text-caption']">
    {{ t('dev_screens.title') }}
  </h3>

  <v-row gap="0">
    <v-col cols="12">
      <v-list :class="`${className}__list`">
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
      <v-list-item :class="`${className}__logging`">
        <v-row gap="0">
          <v-col :class="`${className}__logging-label-column`">
            <span :class="`${className}__logging-label`">
              {{ t('dev_screens.logging') }}
            </span>
          </v-col>
          <v-col cols="6" :class="`${className}__logging-control-column`">
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn :class="`${className}__logging-button`" variant="text" v-bind="props">
                  {{ levelCurrent }}
                </v-btn>
              </template>
              <v-list :class="`${className}__menu-list`">
                <v-list-item
                  v-for="level in levelAll"
                  :key="level"
                  :class="`${className}__menu-item`"
                  @click="onSelectLevel(level)"
                >
                  <v-list-item-title :class="`${className}__menu-item-title`">
                    {{ level }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-list-item>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mdiChevronRight } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LogLevel, useLoggerStore } from '@/lib/logger-store'
import { logger } from '@/utils/devTools/logger'

const router = useRouter()
const loggerStore = useLoggerStore()
const levelAll = computed(() => loggerStore.levelAll)
const { t } = useI18n()

const className = 'dev-screens-view'

const levelCurrent = computed({
  get: () => loggerStore.levelCurrent,
  set: (value) => loggerStore.setLevel(value)
})

const loggerExamples = [
  { level: 'debug', text: 'Debug message: detailed diagnostics for development.' },
  { level: 'info', text: 'Info message: general application event details.' },
  { level: 'warn', text: 'Warning message: potentially harmful situation detected.' },
  { level: 'public', text: 'Public message: always visible regardless of log level.' }
]
const onSelectLevel = (level: LogLevel) => {
  levelCurrent.value = level

  loggerExamples.forEach((example) => {
    logger.log('Dev screen', example.level, example.text)
  })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_switcher-menu.scss' as switcherMenu;
@use '@/assets/styles/settings/_colors.scss';

.dev-screens-view {
  @include switcherMenu.a-switcher-menu();

  &__title {
    margin-block: var(--a-space-4);
    padding-top: var(--a-dev-screen-title-padding-top);
    margin-inline: calc(var(--a-dev-screen-bleed-inline) * -1);
    padding-inline: var(--a-dev-screen-item-padding-inline);
  }

  &__list {
    margin-inline: calc(var(--a-dev-screen-bleed-inline) * -1);

    :deep(.v-list-item) {
      padding-inline-start: var(--a-dev-screen-item-padding-inline);
      padding-inline-end: var(--a-dev-screen-item-padding-inline);
    }
  }

  &__logging {
    margin-inline: calc(var(--a-dev-screen-bleed-inline) * -1);
    padding-inline: var(--a-dev-screen-item-padding-inline);
  }

  &__logging-label-column {
    margin-top: var(--a-space-3);
  }

  &__logging-label {
    display: inline-block;
  }

  &__logging-control-column {
    text-align: end;
    margin-top: var(--a-space-1);
  }

  &__logging-button {
    margin: 0;
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
</style>
