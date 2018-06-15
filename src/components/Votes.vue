<template>
  <div class="votes">
    <md-layout class='chat_loads' v-show="!delegatesLoaded">
      <md-spinner :md-size="150" :md-stroke="1" md-indeterminate class="md-accent" style="margin: 0px -75px;position: fixed;left: 50%;"></md-spinner>
    </md-layout>
    <div style="max-width:95%; margin:auto;" v-show="delegatesLoaded">
      <md-table-card class='votes-card' style="box-shadow:none">
        <md-toolbar>
          <md-layout md-gutter="16">
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
          <md-table md-sort="rank" md-sort-type="desc" @sort="onSort">
            <md-table-header>
              <md-table-row>
                <md-table-head>{{$t('votes.table_head_vote')}}</md-table-head>
                <md-table-head md-sort-by="rank">{{$t('votes.table_head_rank')}}</md-table-head>
                <md-table-head md-sort-by="username">{{$t('votes.table_head_name')}}</md-table-head>
                <md-table-head></md-table-head>  
              </md-table-row>
            </md-table-header>
            <md-table-body v-bind:style="tableStyle">
              <template v-for="(delegate, index) in delegates">
                <md-table-row style="cursor:pointer" :key="delegate.address" v-bind:class="{upvoted: delegate.upvoted, downvoted: delegate.downvoted}" @click.native="toggleDetails(delegate)">
                  <md-table-cell>
                    <md-checkbox v-model="delegate.voted" title="vote" v-on:change="vote(delegate)"></md-checkbox>
                  </md-table-cell>
                  <md-table-cell style="text-align: left">{{ delegate.rank }}</md-table-cell>
                  <md-table-cell style="text-align: left"><span>{{ delegate.username }}</span></md-table-cell>
                  <md-table-cell>
                    <md-icon>{{ delegate.showDetails ? 'keyboard_arrow_down' : 'chevron_right' }}</md-icon>
                  </md-table-cell>
                </md-table-row>
                <md-table-row v-show="delegate.showDetails" style="border-top-width: 0; padding-bottom: 10px">
                  <md-table-cell collspan="4" class="delegate-details">
                    <ul>
                      <li><span class="status-indicator" v-bind:style="delegate.style" v-bind:title="delegate.tooltip"></span>
                      <a target="_blank" v-bind:href="'https://explorer.adamant.im/delegate/'+delegate.address">{{ delegate.address }}</a>
                      </li>
                      <li>
                        {{$t('votes.delegate_approval')}}: <strong>{{ delegate.approval }}%</strong>  
                      </li>
                      <li>
                        {{$t('votes.delegate_uptime')}}: <strong>{{ delegate.productivity }}%</strong>  
                      </li>
                      <li>
                        {{$t('votes.delegate_forged')}}: <strong>{{ (delegate.forged  / 100000000).toFixed(4) }} ADM</strong>  
                      </li>
                      <li>
                        {{$t('votes.delegate_forging_time')}}: <strong>{{ formatForgingTime(delegate.forgingTime) }}</strong>  
                      </li>
                      <li>
                        {{$t('votes.delegate_description')}}: <strong>{{ delegate.description }}</strong>  
                      </li>
                      <li>
                        {{$t('votes.delegate_link')}}: <strong>{{ delegate.link }}</strong>  
                      </li>
                    </ul>
                  </md-table-cell>
                </md-table-row>
              </template>
            </md-table-body>
          </md-table>
      </md-table-card>
      <md-card style="margin-top:10px">
          <md-card-header>
            <div class="md-title">{{ $t('votes.summary_title') }}</div>
            <div class="md-subhead">
              {{$t('votes.upvotes')}}: <strong>{{ upvotedCount }}</strong>,&nbsp;
              {{$t('votes.downvotes')}}: <strong>{{ downvotedCount }}</strong>,&nbsp;
              {{$t('votes.total_new_votes')}}: <strong>{{ downvotedCount + upvotedCount }}</strong> / {{ voteRequestLimit }},&nbsp;
              {{$t('votes.total_votes')}}: <strong>{{ originVotesCount }} / {{ delegates.length }}</strong>
            </div>
          </md-card-header>
          <md-card-actions>
            <md-button style="width:90%" v-bind:disabled="upvotedCount + downvotedCount === 0" v-on:click="sendVotes">{{$t('votes.vote_button_text')}}</md-button>
            <span v-on:click="showSummaryInfo = !showSummaryInfo" style="cursor:pointer"><md-icon>{{ showSummaryInfo ? 'keyboard_arrow_down' : 'chevron_right' }}</md-icon></span>
          </md-card-actions>
          <md-card-content v-show="showSummaryInfo">
             {{$t('votes.summary_info')}} <a href="adamant.im">{{$t('votes.summary_info_link_text')}}</a>
          </md-card-content>
      </md-card>
    </div>
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
        showSummaryInfo: false
      }
    },
    mounted: function () {
      this.$nextTick(() => {
        window.addEventListener('resize', () => {
          this.tableStyle.height = this.formatHeight(window.innerHeight)
        })
      })
      this.$store.commit('clean_delegates')
      this.getDelegates()
    },
    methods: {
      vote (delegate) {
        if (this.votedCount + this.unvotedCount > this.voteRequestLimit) {
          return false
        }
        if (delegate.voted) {
          if (this.$store.state.delegates[delegate.address]._voted) {
            delegate.downvoted = true
          }
          delegate.upvoted = false
        } else {
          if (!this.$store.state.delegates[delegate.address]._voted) {
            delegate.upvoted = true
          }
          delegate.downvoted = false
        }
      },
      onSort (params) {
        this.sortParams = params
      },
      sendVotes () {
        let votes = Array.concat(this.delegates.filter(x => x.downvoted).map(x => `-${x.address}`),
          this.delegates.filter(x => x.upvoted).map(x => x.address))
        this.voteForDelegates(votes)
      },
      toggleDetails (delegate) {
        if (!delegate.showDetails) {
          this.getForgedByAccount(delegate)
          this.getForgingTimeForDelegate(delegate)
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
        return `${height * 0.45}px !important`
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

        return Object.values(this.$store.state.delegates)
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
        return Object.values(this.$store.state.delegates).filter(x => x._voted).length
      },
      totalVotes () {
        return this.downvotedCount + this.originVotesCount - this.downvotedCount
      },
      delegatesLoaded () {
        return Object.keys(this.$store.state.delegates).length > 0
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
.votes .md-table tbody {
  height: 300px;
}

.votes .md-checkbox {
  margin-top: 0;
}
.votes .md-toolbar.md-theme-grey {
  border-bottom: none;
}
.votes .delegate-details {
  width: 100% !important;
  height: auto;
}
.votes .delegate-details ul {
  list-style: none;
}
.md-table-row.downvoted {
  background-color: antiquewhite;
}
.md-table-row.upvoted {
  background-color: azure;
}
.table-summary span {
  padding: 5px;
  margin-top: 20px;
}
.ajax-loader {
  background-color: gainsboro;
}
.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 10px;
  border: 2px solid gray;
  display: inline-block;
  margin: 2px 5px 0;
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
</style>