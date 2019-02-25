<template>
  <div>
    <app-toolbar-centered
      app
      :title="$t('options.nodes_list')"
      :show-back="true"
      flat
    />

    <v-container fluid>
      <v-layout row wrap justify-center>

        <container>

          <v-data-table
            :headers="headers"
            :items="nodes"
            item-key="url"
            select-all
            hide-actions
            class="elevation-1"
          >
            <template slot="headers" slot-scope="props">
              <tr>
                <th></th>
                <th
                  v-for="header in props.headers"
                  :key="header.text"
                  :class="{ 'text-xs-left': header.align === 'left' }"
                >
                  {{ $t(header.text) }}
                </th>
              </tr>
            </template>

            <template slot="items" slot-scope="props">
              <td>
                <v-checkbox
                  :input-value="props.item.active"
                  hide-details
                  color="grey darken-1"
                  @click.native="toggle(props.item)"
                ></v-checkbox>
              </td>
              <td>{{ props.item.url }}</td>
              <td>
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
            :title="$t('nodes.fastest_tooltip')"
            color="grey darken-1"
            v-model="preferFastestNodeOption"
          />

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
