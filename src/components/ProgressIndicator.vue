<template>
  <div class="progress-indicator progress-fog">
    <v-progress-circular
      v-show="showSpinner"
      :size="PROGRESS_INDICATOR_SPINNER_SIZE"
      :stroke="PROGRESS_INDICATOR_SPINNER_STROKE"
      class="progress-indicator__spinner progress-circular"
      indeterminate
    />
  </div>
</template>

<script>
const PROGRESS_INDICATOR_SPINNER_SIZE = 150
const PROGRESS_INDICATOR_SPINNER_STROKE = 1

export default {
  props: {
    showSpinner: {
      default: true,
      type: Boolean
    }
  },
  data: () => ({
    PROGRESS_INDICATOR_SPINNER_SIZE,
    PROGRESS_INDICATOR_SPINNER_STROKE
  })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.progress-indicator {
  background: var(--a-progress-indicator-backdrop);
  position: fixed;
  inset: 0;
  width: 100%;
  min-height: 100vh;
  z-index: var(--a-progress-indicator-z-index);
  display: grid;
  place-items: center;
}

.progress-indicator__spinner {
  color: map.get(colors.$adm-colors, 'regular');
}

.v-theme--dark {
  .progress-indicator__spinner {
    color: map.get(settings.$shades, 'white');
  }
}
</style>
