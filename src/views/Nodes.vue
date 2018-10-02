<template>
  <div class='nodes'>
    <md-table>
      <md-table-header>
        <md-table-row>
          <md-table-head width='100px'>{{ $t('nodes.active') }}</md-table-head>
          <md-table-head>{{ $t('nodes.host') }}</md-table-head>
          <md-table-head>{{ $t('nodes.ping') }}</md-table-head>
        </md-table-row>
      </md-table-header>

      <md-table-body>
        <template v-for="node in nodes">
          <md-table-row :key="node.url">
            <md-table-cell>
              <md-checkbox v-model="node.active" @change="toggle(node)" />
            </md-table-cell>
            <md-table-cell>
              <span>{{ node.url }}</span>
            </md-table-cell>
            <md-table-cell>
              {{ !node.active
                ? $t('nodes.inactive')
                : !node.online
                  ? $t('nodes.offline')
                  : (node.ping + ' ' + $t('nodes.ms')) }}
            </md-table-cell>
          </md-table-row>
        </template>
      </md-table-body>
    </md-table>

    <div class='nodes__options'>
      <md-checkbox :title="$t('nodes.fastest_tooltip')" v-model="preferFastestNode">
        {{ $t('nodes.fastest_title') }}
      </md-checkbox>
    </div>

  </div>
</template>

<script>

export default {
  name: 'nodes',
  data () {
    return {
      preferFastestNode: this.$store.state.nodes.useFastest,
      timer: null
    }
  },
  mounted () {
    this.timer = setInterval(() => this.$store.dispatch('nodes/updateStatus'), 10000)
  },
  destroyed () {
    clearInterval(this.timer)
    this.timer = null
  },
  methods: {
    toggle (node) {
      this.$store.dispatch('nodes/toggle', {
        url: node.url,
        active: !node.active
      })
    }
  },
  computed: {
    nodes () {
      return this.$store.getters['nodes/list']
    }
  },
  watch: {
    preferFastestNode (to, from) {
      this.$store.dispatch('nodes/setUseFastest', to)
    }
  }
}

</script>

<style>
  .nodes .md-table, .nodes .nodes__options {
    text-align: left;
  }

  .nodes .nodes__options {
    padding-left: 24px;
    font-size: 16px;
  }
</style>
