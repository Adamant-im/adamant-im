<template>
  <v-row gap="0">
    <v-col cols="12">
      <div :class="classes.section">
        <h4 :class="classes.sectionTitle">{{ t('dev_vibrations.custom_pattern') }}</h4>

        <v-row align="center" gap="0">
          <v-col cols="8">
            <v-text-field
              v-model="vibro"
              :class="classes.customInput"
              :placeholder="t('dev_vibrations.pattern_placeholder')"
              density="comfortable"
              hide-details
              variant="outlined"
            />
          </v-col>

          <v-col cols="4" :class="classes.playColumn">
            <v-btn
              :class="[classes.playButton, 'a-btn-primary']"
              :disabled="!vibro"
              :prepend-icon="mdiPlay"
              @click="vibration"
              block
            >
              {{ t('dev_vibrations.play') }}
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <div :class="classes.section">
        <h4 :class="classes.sectionTitle">{{ t('dev_vibrations.presets') }}</h4>

        <v-row gap="0">
          <v-col
            v-for="preset in presets"
            :key="preset.key"
            cols="12"
            :class="classes.presetColumn"
          >
            <v-btn
              :class="[classes.presetButton, 'a-btn-regular']"
              :prepend-icon="mdiPlay"
              @click="preset.onClick"
              block
            >
              {{ t(preset.label) }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiPlay } from '@mdi/js'
import { useI18n } from 'vue-i18n'

import { vibrate } from '@/lib/vibrate'

const { t } = useI18n()

const className = 'vibro-view'
const classes = {
  section: `${className}__section`,
  sectionTitle: `${className}__section-title`,
  customInput: `${className}__custom-input`,
  playColumn: `${className}__play-column`,
  playButton: `${className}__play-button`,
  presetColumn: `${className}__preset-column`,
  presetButton: `${className}__preset-button`
}

const vibro = ref('')

const vibration = () => {
  if (!vibro.value) return

  const pattern = vibro.value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item))

  if (pattern.length === 0) return

  navigator.vibrate(pattern)
}

const presets = computed(() => [
  {
    key: 'very-short',
    label: 'dev_vibrations.very_short',
    onClick: () => vibrate.veryShort()
  },
  {
    key: 'short',
    label: 'dev_vibrations.short',
    onClick: () => vibrate.short()
  },
  {
    key: 'medium',
    label: 'dev_vibrations.medium',
    onClick: () => vibrate.medium()
  },
  {
    key: 'long',
    label: 'dev_vibrations.long',
    onClick: () => vibrate.long()
  },
  {
    key: 'double-very-short',
    label: 'dev_vibrations.double_very_short',
    onClick: () => vibrate.doubleVeryShort()
  },
  {
    key: 'triple-very-short',
    label: 'dev_vibrations.triple_very_short',
    onClick: () => vibrate.tripleVeryShort()
  },
  {
    key: 'double-short',
    label: 'dev_vibrations.double_short',
    onClick: () => vibrate.doubleShort()
  }
])
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.vibro-view {
  &__section {
    margin-bottom: var(--a-dev-screen-section-gap);
  }

  &__section-title {
    @include mixins.a-text-regular-enlarged();
    margin-bottom: var(--a-dev-screen-section-title-gap);
    padding-bottom: var(--a-dev-screen-section-title-padding-bottom);
    border-bottom: 1px solid;
  }

  &__play-column {
    padding-inline-start: var(--a-space-3);
  }

  &__preset-column {
    margin-bottom: var(--a-space-3);
  }

  &__preset-button {
    justify-content: flex-start;
    text-transform: none;
  }
}

.v-theme--light {
  .vibro-view {
    &__section-title {
      color: map.get(colors.$adm-colors, 'regular');
      border-color: map.get(colors.$adm-colors, 'secondary2');
    }
  }
}
</style>
