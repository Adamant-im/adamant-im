<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('options.nodes_list')"
      :show-back="true"
      flat
    />

    <v-container
      fluid
      class="pa-0"
    >
      <v-row
        justify="center"
        no-gutters
      >
        <container padding>
          <v-data-table
            :headers="headers"
            :items="nodes"
            :class="`${className}__table`"
            item-key="url"
            show-select
            hide-default-footer
            disable-sort
          >
            <template #[`header.data-table-select`]>
              <!-- hide checkbox -->
            </template>

            <template #[`item.data-table-select`]="props">
              <v-simple-checkbox
                :value="props.item.active"
                :class="`${className}__checkbox`"
                color="grey darken-1"
                @input="toggle(props.item)"
              />
            </template>

            <template #[`item.url`]="props">
              {{ props.item.url }}
              <span
                v-if="props.item.version"
                :class="`${className}__node-version`"
              ><br>{{ 'v' + props.item.version }}</span>
            </template>

            <template #[`item.ping`]="props">
              <span>
                {{ getNodeStatus(props.item) }}
              </span>
              <v-icon
                :color="getNodeColor(props.item)"
                size="small"
              >
                mdi-checkbox-blank-circle
              </v-icon>
            </template>

            <template #[`item.socket`]="props">
              <v-icon :color="props.item.socketSupport ? 'green' : 'red'">
                {{ props.item.socketSupport ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
            </template>
          </v-data-table>

          <v-checkbox
            v-model="preferFastestNodeOption"
            :label="$t('nodes.fastest_title')"
            :class="`${className}__checkbox mt-4`"
            color="grey darken-1"
          />
          <div class="a-text-explanation-enlarged">
            {{ $t('nodes.fastest_tooltip') }}
          </div>

          <v-checkbox
            v-model="useSocketConnection"
            :label="$t('nodes.use_socket_connection')"
            :class="`${className}__checkbox mt-4`"
            color="grey darken-1"
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

export default {
  components: {
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
    },
    nodes () {
      return this.$store.getters['nodes/list']
    },
    headers () {
      return [
        {
          text: this.$t('nodes.host'),
          value: 'url',
          align: 'left'
        },
        {
          text: this.$t('nodes.ping'),
          value: 'ping',
          align: 'left'
        },
        {
          text: this.$t('nodes.socket'),
          value: 'socket',
          align: 'left'
        }
      ]
    }
  },
  mounted () {
    this.$store.dispatch('nodes/restore')

    this.timer = setInterval(() => {
      this.$store.dispatch('nodes/updateStatus')
    }, 10000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    toggle (node) {
      this.$store.dispatch('nodes/toggle', {
        url: node.url,
        active: !node.active
      })
    },
    getNodeStatus (node) {
      if (!node.hasMinApiVersion || !node.hasSupportedProtocol) {
        return this.$t('nodes.unsupported')
      } else if (!node.active) {
        return this.$t('nodes.inactive')
      } else if (!node.online) {
        return this.$t('nodes.offline')
      } else if (node.outOfSync) {
        return this.$t('nodes.sync')
      }

      return node.ping + ' ' + this.$t('nodes.ms')
    },
    getNodeColor (node) {
      let color = 'green'

      if (!node.hasMinApiVersion || !node.hasSupportedProtocol) {
        color = 'red'
      } else if (!node.active) {
        color = 'grey'
      } else if (!node.online) {
        color = 'red'
      } else if (node.outOfSync) {
        color = 'orange'
      }

      return color + ' lighten-1'
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '~vuetify/src/styles/settings/_variables.scss';
@import '../assets/styles/settings/_colors.scss';

.nodes-view {
  &__table {
    margin-left: -24px;
    margin-right: -24px;
    max-width: unset;
    :deep(table.v-table) tbody td:first-child {
      padding-left: 24px;
    }
  }
  &__body {
    font-size: 14px;
    font-weight: 300;
  }
  &__info {
    :deep(a) {
      text-decoration-line: none;
      &:hover {
        text-decoration-line: underline;
      }
    }
  }
  &__node-version {
    @include a-text-explanation-small();
  }
  &__checkbox {
    :deep(.v-label) {
      @include a-text-regular-enlarged();
    }
  }
  :deep(.v-input--selection-controls:not(.v-input--hide-details)) .v-input__slot {
    margin-bottom: 0;
  }

  @media #{map-get($display-breakpoints, 'md-and-up')} {
    :deep(.v-data-table .v-data-table__wrapper table tbody tr td),
    :deep(.v-data-table .v-data-table__wrapper table thead tr th) {
      padding: 0 24px;
    }
  }
}

/** Themes **/
.theme--light {
  .nodes-view {
    &__body {
      color: map-get($adm-colors, 'regular');
    }
    &__node-version {
      color: map-get($adm-colors, 'muted');
    }
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
    :deep(.v-table) tbody tr:not(:last-child) {
      border-bottom: 1px solid map-get($adm-colors, 'secondary2');
    }
  }
}

.theme--dark {
  .nodes-view {
    &__node-version {
      opacity: 0.7;
    }
  }
}

/**
* 1. Style VTable to be full width.
*/
@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .nodes-view {
    &__table { // [1]
      margin-left: -16px;
      margin-right: -16px;
    }

    :deep(table.v-table) tbody td:first-child {
      padding-left: 16px;
    }
  }
}
</style>
