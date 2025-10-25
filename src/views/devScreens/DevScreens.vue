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
  <v-row>
    <v-col cols="6">
      <v-list-subheader>
        {{ t('dev_screens.logging') }}
      </v-list-subheader>
    </v-col>
    <v-col cols="6" class="text-right">
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn class="ma-0 btn" variant="text" v-bind="props">
            {{ levelCurrent }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item :key="level" @click="onSelectLevel(level)" v-for="level in levelAll">
            <v-list-item-title>{{ level }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { level } from '@/store/modules/dev-tools/index.ts'
import { computed } from 'vue'
import { mdiChevronRight } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()
const { t } = useI18n()

const className = 'dev-screens-view'

const levelAll = computed(() => store.getters['devTools/levelAll'])
const levelCurrent = computed({
  get() {
    return store.state.devTools.levelCurrent
  },
  set(value) {
    store.commit('devTools/setLevel', value)
  }
})
const onSelectLevel = (level: level) => {
  levelCurrent.value = level
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.dev-screens-view {
  &__title {
    padding-top: 15px;
    margin-left: -24px;
    margin-right: -24px;
    padding-left: 24px;
    padding-right: 24px;

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 16px;
      padding-right: 16px;
    }
  }

  .dev-list {
    margin-left: -24px;
    margin-right: -24px;

    :deep(.v-list-item) {
      padding-inline-start: 24px;
      padding-inline-end: 24px;

      @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
        padding-inline-start: 16px;
        padding-inline-end: 16px;
      }
    }

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      margin-left: -16px;
      margin-right: -16px;
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
</style>
