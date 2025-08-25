<template>
  <v-row no-gutters>
    <v-col cols="12">
      <div :class="classes.section">
        <h4 :class="classes.sectionTitle">{{ t('dev_vibrations.custom_pattern') }}</h4>
        <v-row align="center" no-gutters>
          <v-col cols="8">
            <v-text-field
              v-model="customPattern"
              :placeholder="t('dev_vibrations.pattern_placeholder')"
              density="comfortable"
              hide-details
              variant="outlined"
            />
          </v-col>
          <v-col cols="4" class="pl-3">
            <v-btn
              @click="playCustomPattern"
              :disabled="!customPattern"
              color="primary"
              :prepend-icon="mdiPlay"
            >
              {{ t('dev_vibrations.play') }}
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <div :class="classes.section">
        <h4 :class="classes.sectionTitle">{{ t('dev_vibrations.presets') }}</h4>
        <v-row no-gutters>
          <v-col cols="12" class="mb-3">
            <v-btn @click="veryShort" :class="classes.presetButton" :prepend-icon="mdiPlay" block>
              {{ t('dev_vibrations.very_short') }}
            </v-btn>
          </v-col>
          <v-col cols="12" class="mb-3">
            <v-btn @click="short" :class="classes.presetButton" :prepend-icon="mdiPlay" block>
              {{ t('dev_vibrations.short') }}
            </v-btn>
          </v-col>
          <v-col cols="12" class="mb-3">
            <v-btn @click="medium" :class="classes.presetButton" :prepend-icon="mdiPlay" block>
              {{ t('dev_vibrations.medium') }}
            </v-btn>
          </v-col>
          <v-col cols="12" class="mb-3">
            <v-btn @click="long" :class="classes.presetButton" :prepend-icon="mdiPlay" block>
              {{ t('dev_vibrations.long') }}
            </v-btn>
          </v-col>
          <v-col cols="12" class="mb-3">
            <v-btn
              @click="doubleVeryShort"
              :class="classes.presetButton"
              :prepend-icon="mdiPlay"
              block
            >
              {{ t('dev_vibrations.double_very_short') }}
            </v-btn>
          </v-col>
          <v-col cols="12" class="mb-3">
            <v-btn
              @click="tripleVeryShort"
              :class="classes.presetButton"
              :prepend-icon="mdiPlay"
              block
            >
              {{ t('dev_vibrations.triple_very_short') }}
            </v-btn>
          </v-col>
          <v-col cols="12" class="mb-3">
            <v-btn @click="doubleShort" :class="classes.presetButton" :prepend-icon="mdiPlay" block>
              {{ t('dev_vibrations.double_short') }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mdiPlay } from '@mdi/js'
import { useI18n } from 'vue-i18n'

import { vibrate } from '@/lib/vibrate'

const { t } = useI18n()

const className = 'dev-vibrations-view'
const classes = {
  header: `${className}__header`,
  title: `${className}__title`,
  section: `${className}__section`,
  sectionTitle: `${className}__section-title`,
  presetButton: `${className}__preset-button`
}

const customPattern = ref('')

const playCustomPattern = () => {
  if (!customPattern.value) return

  try {
    const pattern = customPattern.value.split(',').map((i) => Number(i.trim()))
    navigator.vibrate(pattern)
  } catch (error) {
    console.error('Invalid vibration pattern:', error)
  }
}

const veryShort = () => vibrate.veryShort()
const short = () => vibrate.short()
const medium = () => vibrate.medium()
const long = () => vibrate.long()
const doubleVeryShort = () => vibrate.doubleVeryShort()
const tripleVeryShort = () => vibrate.tripleVeryShort()
const doubleShort = () => vibrate.doubleShort()
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.dev-vibrations-view {
  padding: 24px;

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    padding: 16px;
  }

  &__section {
    margin-bottom: 32px;
  }

  &__section-title {
    @include mixins.a-text-regular-enlarged();
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid;
  }

  &__preset-button {
    font-weight: 500;
    text-transform: none;
    justify-content: flex-start;
  }
}

/** Themes **/
.v-theme--light {
  .dev-vibrations-view {
    &__title {
      color: map.get(colors.$adm-colors, 'regular');
    }

    &__section-title {
      color: map.get(colors.$adm-colors, 'regular');
      border-color: map.get(colors.$adm-colors, 'secondary2');
    }
  }
}
</style>
