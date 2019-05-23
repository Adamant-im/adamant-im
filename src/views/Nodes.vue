<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('options.nodes_list')"
      :show-back="true"
      flat
    />

    <v-container fluid class="pt-0">
      <v-layout row wrap justify-center>

        <container>

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
              <td class="pl-3 pr-2">
                <v-checkbox
                  :input-value="props.item.active"
                  :class="`${className}__checkbox`"
                  hide-details
                  color="grey darken-1"
                  @click.native="toggle(props.item)"
                ></v-checkbox>
              </td>
              <td :class="`${className}__body`" class="pl-0">{{ props.item.url }}</td>
              <td :class="`${className}__body`" class="pl-0">
                <span>
                  {{ props.item.online ? `${props.item.ping} ms` : $t('nodes.offline') }}
                </span>
                <v-icon
                  :color="props.item.online ? 'green lighten-1' : 'red lighten-1'"
                  size="small"
                >mdi-checkbox-blank-circle</v-icon>
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
      margin-left: -20px
      margin-right: -20px
</style>
