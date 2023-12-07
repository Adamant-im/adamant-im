<template>
  <div :class="classes.root">
    <app-toolbar-centered app :title="$t('options.wallets_list')" :show-back="true" flat fixed />

    <v-container fluid class="px-0 container--with-app-toolbar">
      <v-row justify="center" no-gutters>
        <container padding> </container>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import { defineComponent } from 'vue'

const className = 'wallets-view'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    AppToolbarCentered
  },
  setup() {
    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/themes/adamant/_mixins.scss';
@import 'vuetify/settings';
@import '@/assets/styles/settings/_colors.scss';

.wallets-view {
  &__info {
    :deep(a) {
      text-decoration-line: none;
      &:hover {
        text-decoration-line: underline;
      }
    }
  }
  :deep(.v-input--selection-controls:not(.v-input--hide-details)) .v-input__slot {
    margin-bottom: 0;
  }

  :deep(.v-checkbox) {
    margin-left: -8px;
  }
}

/** Themes **/
.v-theme--light {
  .wallets-view {
    &__checkbox {
      :deep(.v-label) {
        color: map-get($adm-colors, 'regular');
      }
      :deep(.v-input--selection-controls__ripple),
      :deep(.v-input--selection-controls__input) i {
        color: map-get($adm-colors, 'regular') !important;
        caret-color: map-get($adm-colors, 'regular') !important;
      }
    }
  }
}
</style>
