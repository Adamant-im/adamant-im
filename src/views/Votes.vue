<template>
  <div class="votes">
    <md-layout class='chat_loads' v-show="!delegatesLoaded">
      <md-spinner :md-size="150" :md-stroke="1" md-indeterminate class="md-accent" style="margin: 0px -75px;position: fixed;left: 50%;"></md-spinner>
    </md-layout>
    <div class="white-color-table" style="max-width:95%; margin:auto;" v-show="delegatesLoaded">
      <md-table-card class='votes-card' style="box-shadow:none">
        <md-toolbar class="custom-votes-toolbar">
          <md-layout class="white-color-search-bar">
            <md-layout md-flex="100">
              <md-input-container>
                <md-button class="md-icon-button">
                  <md-icon>search</md-icon>
                </md-button>
                <md-input style="width:100%" v-model="filterString" v-bind:placeholder="$t('votes.filter_placeholder')"></md-input>
              </md-input-container>
            </md-layout>
          </md-layout>
        </md-toolbar>
          <md-table md-sort="rank" md-sort-type="desc" @sort="onSort" v-bind:style="tableStyle">
            <md-table-header>
              <md-table-row>
                <md-table-head>{{$t('votes.table_head_vote')}}</md-table-head>
                <md-table-head md-sort-by="rank">{{$t('votes.table_head_rank')}}</md-table-head>
                <md-table-head md-sort-by="username">{{$t('votes.table_head_name')}}</md-table-head>
                <md-table-head></md-table-head>
              </md-table-row>
            </md-table-header>
            <md-table-body>
              <template v-for="(delegate, index) in delegates">
                <md-table-row style="cursor:pointer"
                              class="delegate-row"
                              :key="delegate.address+index"
                              v-bind:class="{upvoted: delegate.upvoted, downvoted: delegate.downvoted, active: delegate.showDetails}"
                              v-on:click.native="toggleDetails(delegate)">
                  <md-table-cell>
                    <md-checkbox v-model="delegate.voted" title="vote" v-on:change="vote(delegate)"></md-checkbox>
                  </md-table-cell>
                  <md-table-cell style="text-align: left">{{ delegate.rank }}</md-table-cell>
                  <md-table-cell style="text-align: left"><span>{{ delegate.username }}</span></md-table-cell>
                  <md-table-cell>
                    <md-icon>{{ delegate.showDetails ? 'keyboard_arrow_down' : 'chevron_right' }}</md-icon>
                  </md-table-cell>
                </md-table-row>
                <md-table-row v-show="delegate.showDetails"
                              style="border-top-width: 0; padding-bottom: 10px"
                              class="delegate-row"
                              :key="index+delegate.address"
                              v-bind:class="{upvoted: delegate.upvoted, downvoted: delegate.downvoted, active: delegate.showDetails}">
                  <md-table-cell collspan="4" class="delegate-details">
                    <md-layout md-column>

                      <md-layout md-gutter md-column-xsmall>
                        <md-layout class="delegate-info-box">
                          <span class="status-indicator"
                                v-bind:style="delegate.style"
                                v-bind:title="delegate.tooltip"></span>
                          <a target="_blank"
                             v-bind:href="'https://explorer.adamant.im/delegate/'+delegate.address">
                            {{ delegate.address }}
                          </a>
                        </md-layout>
                        <md-layout md-hide-xsmall></md-layout>
                      </md-layout>

                      <md-layout md-gutter md-column-xsmall>

                        <md-layout class="delegate-info-box">
                          {{ $t('votes.delegate_uptime') }}:&nbsp;
                          <strong>{{ delegate.productivity }}%</strong>
                        </md-layout>

                        <md-layout class="delegate-info-box">
                          {{ $t('votes.delegate_approval') }}:&nbsp;
                          <strong>{{ delegate.approval }}%</strong>
                        </md-layout>

                      </md-layout>

                      <md-layout md-gutter md-column-xsmall>

                        <md-layout class="delegate-info-box">
                          {{ $t('votes.delegate_forging_time') }}:&nbsp;
                          <strong>{{ formatForgingTime(delegate.forgingTime) }}</strong>
                        </md-layout>

                        <md-layout class="delegate-info-box">
                          {{ $t('votes.delegate_forged') }}:&nbsp;
                          <strong>{{ (delegate.forged  / 100000000).toFixed(4) }}ADM</strong>
                        </md-layout>

                      </md-layout>

                      <md-layout md-gutter md-column-xsmall>
                        <md-layout class="delegate-info-box">
                          {{ $t('votes.delegate_link') }}:&nbsp;
                          <strong>{{ delegate.link }}</strong>
                        </md-layout>

                        <md-layout class="delegate-info-box">
                          {{ $t('votes.delegate_description') }}:&nbsp;
                          <strong>{{ delegate.description }}</strong>
                        </md-layout>
                      </md-layout>

                    </md-layout>
                  </md-table-cell>
                </md-table-row>
              </template>
            </md-table-body>
          </md-table>
      </md-table-card>
      <md-card>
          <md-card-header>
            <div class="md-title">{{ $t('votes.summary_title') }}</div>
            <div class="md-subhead">
              {{$t('votes.upvotes')}}: <strong>{{ upvotedCount }}</strong>,&nbsp;
              {{$t('votes.downvotes')}}: <strong>{{ downvotedCount }}</strong>,&nbsp;
              {{$t('votes.total_new_votes')}}: <strong>{{ downvotedCount + upvotedCount }}</strong> / {{ voteRequestLimit }},&nbsp;
              {{$t('votes.total_votes')}}: <strong>{{ originVotesCount }} / {{ delegates.length }}</strong>
            </div>
          </md-card-header>
          <md-card-expand>
            <md-card-actions>
              <md-button v-bind:disabled="upvotedCount + downvotedCount === 0"
                         v-on:click="sendVotes">{{$t('votes.vote_button_text')}}</md-button>
              <span style="flex: 1"></span>
              <md-button class="md-icon-button" md-expand-trigger>
                <md-icon>keyboard_arrow_down</md-icon>
              </md-button>
            </md-card-actions>
            <md-card-content style="text-align: left">
              {{$t('votes.summary_info')}} <a href="https://adamant.im" target="_blank">{{$t('votes.summary_info_link_text')}}</a>
            </md-card-content>
          </md-card-expand>
      </md-card>
    </div>
    <md-snackbar md-position="bottom center" md-accent ref="votesSnackbar" md-duration="5000">
      <span>{{ votesErrorMsg}}</span>
    </md-snackbar>
  </div>
</template>

<script>
export default {
  name: 'votes',
  data () {
    return {
      voteRequestLimit: 30,
      sortParams: {
        name: 'rank',
        type: 'desc'
      },
      filterString: '',
      status: [
        { style: { 'background-color': 'green', 'border-color': 'green' }, tooltip: 'Forging' },
        { style: { 'background-color': 'orange', 'border-color': 'orange' }, tooltip: 'Missed block' },
        { style: { 'background-color': 'red', 'border-color': 'red' }, tooltip: 'Not forging' },
        { style: { 'border-color': 'green' }, tooltip: 'Awaiting slot' },
        { style: { 'border-color': 'orange' }, tooltip: 'Awaiting slot' },
        { style: { 'border-color': 'gray' }, tooltip: 'Awaiting status' }
      ],
      tableStyle: {
        height: this.formatHeight(window.innerHeight)
      },
      votesErrorMsg: ''
    }
  },
  mounted: function () {
    this.$nextTick(() => {
      window.addEventListener('resize', () => {
        this.tableStyle.height = this.formatHeight(window.innerHeight)
      })
    })
    this.$store.dispatch('delegates/getDelegates', { address: this.$store.state.address })
  },
  methods: {
    vote (delegate) {
      if (this.votedCount + this.unvotedCount > this.voteRequestLimit) {
        return false
      }
      if (delegate.voted) {
        if (this.$store.state.delegates.delegates[delegate.address]._voted) {
          delegate.downvoted = true
        }
        delegate.upvoted = false
      } else {
        if (!this.$store.state.delegates.delegates[delegate.address]._voted) {
          delegate.upvoted = true
        }
        delegate.downvoted = false
      }
    },
    onSort (params) {
      this.sortParams = params
    },
    sendVotes () {
      if (this.$store.state.balance < 50) {
        this.votesErrorMsg = this.$t('votes.no_money')
        this.$refs.votesSnackbar.open()
      } else {
        let votes = Array.concat(this.delegates.filter(x => x.downvoted).map(x => `-${x.publicKey}`),
          this.delegates.filter(x => x.upvoted).map(x => `+${x.publicKey}`))
        this.$store.dispatch('delegates/voteForDelegates', { votes: votes, address: this.$store.state.address })
      }
    },
    toggleDetails (delegate) {
      if (!delegate.showDetails) {
        this.$store.dispatch('delegates/getForgedByAccount', delegate)
        this.$store.dispatch('delegates/getForgingTimeForDelegate', delegate)
      }
      delegate.showDetails = !delegate.showDetails
    },
    formatForgingTime (seconds) {
      if (!seconds) {
        return '...'
      }
      if (seconds === 0) {
        return 'Now!'
      }
      const minutes = Math.floor(seconds / 60)
      seconds = seconds - (minutes * 60)
      if (minutes && seconds) {
        return `${minutes} min ${seconds} sec`
      } else if (minutes) {
        return `${minutes} min `
      } else {
        return `${seconds} sec`
      }
    },
    statusStyle (delegate) {
      return this.status[delegate.status || 5].style
    },
    statusTooltip (delegate) {
      return this.status[delegate.status || 5].tooltip
    },
    formatHeight (height) {
      return `${height * 0.60}px !important`
    }
  },
  watch: {
    errorMsg (value) {
      this.votesErrorMsg = value
      this.$refs.votesSnackbar.open()
      window.setTimeout(() => this.$store.commit('send_error', { msg: '' }), 5000) // cleanup error msg
    }
  },
  computed: {
    delegates () {
      const compare = (a, b) => {
        const compareNumbers = (x, y) => this.sortParams.type === 'desc' ? x - y : y - x
        const compareString = (x, y) => {
          x = x.toUpperCase()
          y = y.toUpperCase()
          if (x < y) {
            return this.sortParams.type === 'desc' ? -1 : 1
          }
          if (x > y) {
            return this.sortParams.type === 'desc' ? 1 : -1
          }
          return 0
        }
        const lVal = a[this.sortParams.name]
        const rVal = b[this.sortParams.name]
        if (typeof lVal === 'string' && typeof rVal === 'string') {
          // check for ADAMANT ID field
          let [x, ...xs] = lVal
          if (x === 'U') {
            let [, ...ys] = rVal
            return compareNumbers(parseInt(xs.join('')), parseInt(ys.join('')))
          } else {
            return compareString(lVal, rVal)
          }
        }
        if (typeof lVal === 'number' && typeof rVal === 'number') {
          return compareNumbers(lVal, rVal)
        }
        console.log('uncompared values!', a, b)
        return 0
      }
      const filterDelegates = (x) => {
        const regexp = new RegExp(this.filterString, 'i')
        return this.filterString !== '' ? (regexp.test(x.address) || regexp.test(x.username)) : true
      }

      return Object.values(this.$store.state.delegates.delegates)
        .filter(filterDelegates)
        .sort(compare)
        .map((x) => {
          x.style = this.status[x.status].style
          x.tooltip = this.status[x.status].tooltip
          return x
        })
    },
    delegatesCount () {
      return this.delegates.length
    },
    upvotedCount () {
      return this.delegates.filter(x => x.upvoted).length
    },
    downvotedCount () {
      return this.delegates.filter(x => x.downvoted).length
    },
    originVotesCount () {
      return Object.values(this.$store.state.delegates.delegates).filter(x => x._voted).length
    },
    totalVotes () {
      return this.downvotedCount + this.originVotesCount - this.downvotedCount
    },
    delegatesLoaded () {
      return Object.keys(this.$store.state.delegates.delegates).length > 0
    },
    errorMsg () {
      return this.$store.state.lastErrorMsg
    }
  }
}
</script>
<style>
.votes {
  position: relative;
}
.votes .md-checkbox .md-checkbox-container:after {
  border: 2px solid gray;
  border-top: 0;
  border-left: 0;
}
.votes .md-table {
  display: block;
  overflow: hidden;
}
.votes .md-table table, .votes .md-table thead, .votes .md-table tbody, .votes .md-table tr {
  width: 100%;
  display: block;
}
.votes .md-table .md-table-row:hover .md-table-cell {
  background-color: transparent !important;
}
.votes .md-table tr:hover {
  background-color: #eee;
}
.votes .md-table td, .votes .md-table th {
  width: 24%;
  display: inline-block;
  padding: 10px;
}
.votes .md-table tbody, .votes .md-table thead {
  overflow: auto;
}

.votes .md-table-head {
  padding-bottom: 0 !important;
}

.votes .md-table table {
  height: 100%;
}

.votes .md-table tbody {
  height: calc(100% - 66px);
  overflow-x: hidden;
}

.votes .md-checkbox {
  margin-top: 0;
}
.votes .md-toolbar.md-theme-grey {
  border-bottom: none;
  padding-top: 25px;
}
.votes .delegate-details {
  width: 100% !important;
  height: auto !important;
}
.votes .delegate-details ul {
  list-style: none;
}
.md-table-row.delegate-row.active {
  background-color: #eee;
}
.md-table-row.delegate-row.downvoted,.md-table-row.delegate-row.downvoted:hover {
  background-color: antiquewhite;
}
.md-table-row.delegate-row.upvoted,.md-table-row.delegate-row.upvoted:hover {
  background-color: azure;
}

.table-summary span {
  padding: 5px;
  margin-top: 20px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 10px;
  border: 2px solid gray;
  display: inline-block;
  margin: 5px 5px 0 0;
}
.chat_loads {
  position: absolute;
  background: rgba(0,0,0,0.3);
  height: 100%;
  width: 100%;
  min-height: 100vh;
  left: 0;

  padding-top: 15%;
  z-index: 10;
  top: -25px;
}
.md-spinner.md-accent .md-spinner-path
{
  stroke: #4A4A4A;
}

.md-table-cell.delegate-details, .md-table-cell.delegate-details .md-table-cell-container {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-left: 5px;
}
.md-table-cell ul {
  margin-top: 0;
  margin-bottom: 0;
}

.votes .md-card {
  margin-top: 20px;
  padding-bottom: 10px;
}

.votes .md-card-header {
  text-align: left;
}
@media (max-width: 600px) {
  .votes .md-column-xsmall .delegate-info-box {
    padding: 0 3px 10px 0;
  }
}

.white-color-table {
  background-color: #FFFFFF;
}

.white-color-search-bar {
  background-color: #FFF;
  padding: 35px 0 0 0;
  margin-top: -25px;
  margin-left: 0px;
  margin-right: 0px;
}

.custom-votes-toolbar {
  background: repeating-linear-gradient(140deg,#f6f6f6,#f6f6f6 1px,#fefefe 0,#fefefe 5px) !important;
  margin-left: 0px !important;
  margin-right: 0px !important;
  padding-right: 0px !important;
  padding-left: 0px !important;
  position: relative !important;
}

</style>
