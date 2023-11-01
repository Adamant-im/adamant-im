<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('options.nodes_list')"
      :show-back="true"
      flat
      fixed
    />

    <v-container
      fluid
      class="px-0 container--with-app-toolbar"
    >
      <v-row
        justify="center"
        no-gutters
      >
        <container padding>
          <nodes-table :class="`${className}__table`" />

          <v-checkbox
            v-model="preferFastestNodeOption"
            :label="$t('nodes.fastest_title')"
            :class="`${className}__checkbox mt-4`"
            color="grey darken-1"
            hide-details
          />
          <div class="a-text-explanation-enlarged">
            {{ $t('nodes.fastest_tooltip') }}
          </div>

          <v-checkbox
            v-model="useSocketConnection"
            :label="$t('nodes.use_socket_connection')"
            :class="`${className}__checkbox mt-4`"
            color="grey darken-1"
            hide-details
          />
          <div class="a-text-explanation-enlarged">
            {{ $t('nodes.use_socket_connection_tooltip') }}
          </div>

          <!-- eslint-disable vue/no-v-html -- Safe internal content -->
          <div
            :class="`${className}__info a-text-regular-enlarged`"
            class="mt-6"
            v-html="$t('nodes.nodeLabelDescription')"
          />
          <!-- eslint-enable vue/no-v-html -->

          <div>&nbsp;<br>&nbsp;</div>
        </container>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import AppToolbarCentered from '@/components/AppToolbarCentered'
import NodesTable from '@/components/NodesTable/NodesTable'

export default {
  components: {
    NodesTable,
    AppToolbarCentered
  },
  data: () => ({
    pagination: {
      sortBy: 'name'
    },
    timer: null
  }),
  computed: {
    className: () => 'nodes-view',
    useSocketConnection: {
      get () {
        return this.$store.state.options.useSocketConnection
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'useSocketConnection',
          value
        })
      }
    },
    preferFastestNodeOption: {
      get () {
        return this.$store.state.nodes.useFastest
      },
      set (value) {
        this.$store.dispatch('nodes/setUseFastest', value)
      }
    }
  },
  mounted () {
    this.$store.dispatch('nodes/restore')

    this.$store.dispatch('nodes/updateStatus')
    this.timer = setInterval(() => {
      this.$store.dispatch('nodes/updateStatus')
    }, 10000)
  },
  beforeUnmount () {
    clearInterval(this.timer)
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/themes/adamant/_mixins.scss';
@import 'vuetify/settings';
@import '../assets/styles/settings/_colors.scss';

.nodes-view {
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
  .nodes-view {
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
