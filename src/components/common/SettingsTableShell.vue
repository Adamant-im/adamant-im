<template>
  <div :class="classes.root">
    <div v-if="$slots.before" :class="classes.section">
      <slot name="before" />
    </div>

    <div :class="classes.bleed">
      <slot />
    </div>

    <div v-if="$slots.after" :class="classes.section">
      <slot name="after" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const className = 'settings-table-shell'
const classes = {
  root: className,
  bleed: `${className}__bleed`,
  section: `${className}__section`
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/settings';

.settings-table-shell {
  --a-settings-table-shell-bleed-inline-start: var(--a-space-6);
  --a-settings-table-shell-bleed-inline-end: var(--a-space-6);
  --a-settings-table-shell-section-inline-start: 0px;
  --a-settings-table-shell-section-inline-end: 0px;
  --a-settings-table-shell-checkbox-offset: calc(var(--a-space-2) * -1);

  display: block;
  width: 100%;

  &__bleed {
    margin-inline-start: calc(var(--a-settings-table-shell-bleed-inline-start) * -1);
    margin-inline-end: calc(var(--a-settings-table-shell-bleed-inline-end) * -1);
  }

  &__section {
    padding-inline-start: var(--a-settings-table-shell-section-inline-start);
    padding-inline-end: var(--a-settings-table-shell-section-inline-end);
  }

  :deep(.v-input--selection-controls:not(.v-input--hide-details)) .v-input__slot {
    margin-bottom: 0;
  }

  :deep(.v-input--selection-controls) {
    margin-top: 0;
  }

  :deep(.v-checkbox) {
    margin-inline-start: var(--a-settings-table-shell-checkbox-offset);
  }
}

@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .settings-table-shell {
    /*
      Match NavigationWrapper -> Container mobile padding (left 24px, right 16px),
      so bleed sections truly stretch edge-to-edge on mobile too.
    */
    --a-settings-table-shell-bleed-inline-start: var(--a-space-6);
    --a-settings-table-shell-bleed-inline-end: var(--a-space-4);
  }
}

.v-theme--dark {
  .settings-table-shell {
    :deep(.a-text-explanation),
    :deep(.a-text-explanation-small),
    :deep(.a-text-explanation-bold),
    :deep(.a-text-explanation-enlarged),
    :deep(.a-text-explanation-enlarged-bold) {
      color: var(--a-color-text-muted-dark);
    }
  }
}
</style>
