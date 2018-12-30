<template>
  <v-layout row wrap justify-center>

    <app-toolbar
      :title="$t('options.nodes_list')"
      flat
    />

    <v-flex xs12 sm12 md8 lg5>

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
              {{ props.item.online ? `${props.item.ping} ms` : $t('offline') }}
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

    </v-flex>

  </v-layout>
</template>

<script>
import AppToolbar from '@/components/AppToolbar'

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
    AppToolbar
  }
}
</script>

<i18n>
{
  "en": {
    "offline": "offline"
  },
  "ru": {
    "offline": "неактивен"
  }
}
</i18n>
