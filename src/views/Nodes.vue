<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('options.nodes_list')"
      :show-back="true"
      flat
    />

    <v-container fluid class="pa-0">
      <v-layout row wrap justify-center>

        <container padding>

          <v-data-table
            :headers="headers"
            :items="nodes"
            :class="`${className}__table`"
            item-key="url"
            select-all
            hide-actions
          >
            <template slot="headers" slot-scope="props">
              <tr>
                <th style="width:56px"></th>
                <th
                  v-for="header in props.headers"
                  :key="header.text"
                  :class="[
                    `${className}__header`,
                    'pa-0',
                    { 'text-xs-left': header.align === 'left' }
                  ]"
                >
                  {{ $t(header.text) }}
                </th>
              </tr>
            </template>

            <template slot="items" slot-scope="props">
              <td class="pr-2">
                <v-checkbox
                  :input-value="props.item.active"
                  :class="`${className}__checkbox`"
                  hide-details
                  color="grey darken-1"
                  @click.native="toggle(props.item)"
                ></v-checkbox>
              </td>
              <td :class="`${className}__body`" class="pl-0 pr-2">{{ props.item.url }}</td>
              <td :class="`${className}__body`" class="pl-0 pr-2">
                <span>
                  {{ getNodeStatus(props.item) }}
                </span>
                <v-icon
                  :color="getNodeColor(props.item)"
                  size="small"
                >mdi-checkbox-blank-circle</v-icon>
              </td>
              <td :class="`${className}__body`" class="pl-0 pr-2">
                <v-icon :color="props.item.socketSupport ? 'green' : 'red'">
                  {{ props.item.socketSupport ? 'mdi-check' : 'mdi-close' }}
                </v-icon>
              </td>
            </template>
          </v-data-table>

          <v-checkbox
            :label="$t('nodes.fastest_title')"
            :class="`${className}__checkbox`"
            color="grey darken-1"
            v-model="preferFastestNodeOption"
          />
          <div class="a-text-explanation-enlarged">{{ $t('nodes.fastest_tooltip') }}</div>

          <v-checkbox
            :label="$t('nodes.use_socket_connection')"
            :class="`${className}__checkbox`"
            color="grey darken-1"
            v-model="useSocketConnection"
          />
          <div class="a-text-explanation-enlarged">{{ $t('nodes.use_socket_connection_tooltip') }}</div>

          <div
            :class="`${className}__info a-text-regular-enlarged`"
            v-html="$t('nodes.nodeLabelDescription')"
            class="mt-4"
          ></div>

        </container>

      </v-layout>
    </v-container>
  </div>
</template>

<script>
import AppToolbarCentered from '@/components/AppToolbarCentered'

export default {
  mounted () {
    this.$store.dispatch('nodes/restore')

    this.timer = setInterval(() => {
      this.$store.dispatch('nodes/updateStatus')
    }, 10000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
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
    }
  },
  data: () => ({
    pagination: {
      sortBy: 'name'
    },
    headers: [
      {
        text: 'nodes.host',
        value: 'url',
        align: 'left'
      },
      {
        text: 'nodes.ping',
        value: 'ping',
        align: 'left'
      },
      {
        text: 'nodes.socket',
        value: 'socket',
        align: 'left'
      }
    ],
    timer: null
  }),
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
  },
  components: {
    AppToolbarCentered
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_variables.styl'
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'

.nodes-view
  &__table
    margin-left: -24px
    margin-right: -24px

    >>> table.v-table tbody td:first-child
      padding-left: 24px

  &__header
    font-size: 12px
    font-weight: 300
  &__body
    font-size: 14px
    font-weight: 300
  &__info
    >>> a
      text-decoration-line: none
      &:hover
        text-decoration-line: underline
  &__checkbox
    >>> .v-label
      a-text-regular-enlarged()
  >>> .v-input--selection-controls:not(.v-input--hide-details) .v-input__slot
    margin-bottom: 0

/** Themes **/
.theme--light
  .nodes-view
    &__header
      color: $adm-colors.muted
    &__body
      color: $adm-colors.regular
    &__checkbox
      >>> .v-label
        color: $adm-colors.regular
      >>> .v-input--selection-controls__ripple
      >>> .v-input--selection-controls__input i
        color: $adm-colors.regular !important
        caret-color: $adm-colors.regular !important

    >>> .v-table tbody tr:not(:last-child)
      border-bottom: 1px solid $adm-colors.secondary2

/**
 * 1. Style VTable to be full width.
 */
@media $display-breakpoints.sm-and-down
  .nodes-view
    &__table // [1]
      margin-left: -16px
      margin-right: -16px

    >>> table.v-table tbody td:first-child
      padding-left: 16px
</style>
