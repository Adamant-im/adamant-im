<template>
  <md-table v-once class='endpoints'>
    <md-table-header>
      <md-table-row>
        <md-table-head width='100px'>{{ $t('endpoints.active') }}</md-table-head>
        <md-table-head>{{ $t('endpoints.host') }}</md-table-head>
        <md-table-head>{{ $t('endpoints.ping') }}</md-table-head>
      </md-table-row>
    </md-table-header>

    <md-table-body>
      <md-table-row v-for="(endpoint) in endpoints" :key="endpoint.url">
        <md-table-cell>
          <md-checkbox v-model="endpoint.active" v-on:change="toggle(endpoint)" />
        </md-table-cell>
        <md-table-cell>
          <span>{{ endpoint.url }}</span>
        </md-table-cell>
        <md-table-cell>
          {{ endpoint.offline ? $t('endpoints.offline') : (endpoint.ping + ' ' + $t('endpoints.ms')) }}
        </md-table-cell>
      </md-table-row>
    </md-table-body>
  </md-table>
</template>

<script>

export default {
  name: 'endpoints',
  mounted () {
    this.$store.dispatch('endpoints/updateStatus')
  },
  methods: {
    toggle (endpoint) {
      this.$store.commit('endpoints/toggle', {
        url: endpoint.url,
        active: !endpoint.active
      })
    }
  },
  computed: {
    endpoints () {
      return this.$store.state.endpoints.endpoints
    }
  }
}

</script>

<style>
  .md-table.endpoints {
    text-align: left;
  }

  .endpoints.md-table .md-table-head-text {
    padding-left: 0;
  }
</style>
