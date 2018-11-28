<template>
  <v-layout row wrap justify-center>

    <v-flex md5>

      <v-data-table
        :headers="headers"
        :items="nodes"
        item-key="url"
        select-all
        class="elevation-1"
      >
        <template slot="headers" slot-scope="props">
          <tr>
            <th></th>
            <th
              v-for="header in props.headers"
              :key="header.text"
              :class="['column sortable', pagination.descending ? 'desc' : 'asc', header.value === pagination.sortBy ? 'active' : '']"
              @click="changeSort(header.value)"
            >
              <v-icon small>arrow_upward</v-icon>
              {{ header.text }}
            </th>
          </tr>
        </template>

        <template slot="items" slot-scope="props">
          <td>
            <v-checkbox
              :input-value="props.item.active"
              primary
              hide-details
              @click.native="toggle(props.item)"
            ></v-checkbox>
          </td>
          <td>{{ props.item.url }}</td>
          <td class="text-xs-right">{{ props.item.ping }} ms</td>
          <td class="text-xs-right">
            <v-icon :color="props.item.online ? 'green' : 'red'">mdi-checkbox-blank-circle</v-icon>
          </td>
        </template>
      </v-data-table>

      <v-checkbox
        label="Prefer the fastest node"
        v-model="preferFastestNodeOption"
      ></v-checkbox>

    </v-flex>

  </v-layout>
</template>

<script>
  export default {
    mounted () {
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
        { text: 'Host', value: 'url' },
        { text: 'Ping', value: 'ping' },
        { text: 'Status', value: 'online' }
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
    }
  }
</script>
