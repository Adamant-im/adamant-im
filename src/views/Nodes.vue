<template>
  <div class='nodes view_with_toolbar'>
    <md-table md-sort="url" md-sort-type="desc" @sort="onSort" class="md-table-grey">
      <md-table-header>
        <md-table-row>
          <md-table-head>{{ $t('nodes.active') }}</md-table-head>
          <md-table-head md-sort-by="url">{{ $t('nodes.host') }}</md-table-head>
          <md-table-head md-sort-by="ping">{{ $t('nodes.ping') }}</md-table-head>
        </md-table-row>
      </md-table-header>

      <md-table-body>
        <template v-for="node in nodes">
          <md-table-row
            :key="node.url"
            :class="{ 'node-inactive': !node.active, 'node-offline': node.active && !node.online }"
          >
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
      timer: null,
      sortParams: {
        name: 'url',
        type: 'asc'
      }
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
    },
    onSort (params) {
      this.sortParams = params
    }
  },
  computed: {
    nodes () {
      let nodes = this.$store.getters['nodes/list']
      nodes = nodes.sort((a, b) => {
        const l = a[this.sortParams.name]
        const r = b[this.sortParams.name]
        let res = 0
        if (l < r) res = -1
        if (l > r) res = 1
        return this.sortParams.type === 'asc' ? res : -res
      })
      return nodes
    }
  },
  watch: {
    preferFastestNode (to, from) {
      this.$store.dispatch('nodes/setUseFastest', to)
    }
  }
}

</script>

<style lang="scss">
  .nodes {
    background-color: #fff;

    .nodes__options {
      text-align: left;
      padding-left: 24px;
      font-size: 16px;
      max-width: 95%;
      margin: 10px auto auto auto;
    }

    .md-table {
      max-width: 95%;
      margin: 25px auto auto auto;

      .md-table-header {
        text-align: center;

        .md-table-head-text {
          padding-right: 8px;
        }
      }

      .node-inactive .md-table-cell {
        color: gray;
      }

      .node-offline .md-table-cell {
        color: red;
      }

      .md-table-row .md-table-cell:nth-child(2) .md-table-cell-container {
        text-overflow: ellipsis;
        overflow: auto;
      }

      .md-table-cell .md-table-cell-container {
        text-align: left;
        padding-top: 0;
        padding-bottom: 0;
        padding-right: 0;

        .md-checkbox {
          margin-top: 0;
          margin-bottom: 0;
        }
      }
    }
  }
</style>
