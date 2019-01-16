<template>
  <v-layout row wrap justify-center>

    <app-toolbar
      :title="$t('votes.page_title')"
      flat
    />

    <v-flex xs12 sm12 md8 lg5>

      <v-card>
        <v-card-title>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('votes.search')"
            single-line
            hide-details
          />
        </v-card-title>

        <v-data-table
          :headers="headers"
          :pagination.sync="pagination"
          :items="delegates"
          :rows-per-page-text="$t('rows_per_page')"
          :search="search"
          item-key="username"
          class="elevation-1"
        >
          <div slot="no-data" class="text-xs-center">
            <div v-if="waitingForConfirmation">
              <v-progress-circular
                indeterminate
                color="grey darken-1"
                size="24"
                class="mr-3"
              />
              <span>{{ $t('votes.waiting_confirmations') }}</span>
            </div>
            <div v-else>
              {{ $t('votes.no_data_available') }}
            </div>
          </div>

          <template slot="headerCell" slot-scope="props">
            <span slot="activator">
              {{ $t(props.header.text) }}
            </span>
          </template>

          <template slot="items" slot-scope="props">
            <td>{{ props.item.username }}</td>
            <td>{{ props.item.rank }}</td>
            <td>
              <v-icon v-if="props.item._voted" @click="downVote(props.item.address)">mdi-thumb-up</v-icon>
              <v-icon v-else @click="upVote(props.item.address)">mdi-thumb-up-outline</v-icon>
            </td>
            <td>
              <v-btn icon @click="toggleDetails(props.item, props)">
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </td>
          </template>

          <template slot="expand" slot-scope="props">
            <v-card flat>

              <v-list>
                <v-list-tile>
                  <v-list-tile-content>
                    <v-list-tile-title>
                      <a :href="'https://explorer.adamant.im/delegate/' + props.item.address" target="_blank">
                        {{ props.item.address }}
                      </a>
                    </v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>

                <v-list-tile
                  v-for="(item, i) in delegateDetails"
                  :key="i"
                >
                  <v-list-tile-content>
                    <v-list-tile-title>
                      {{ item.title }}
                    </v-list-tile-title>
                  </v-list-tile-content>
                  <v-list-tile-content>
                    <v-list-tile-title class="text-xs-right">
                      {{ item.format ? item.format(item.value.call(props.item)) : item.value.call(props.item) }}
                    </v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
              </v-list>

            </v-card>
          </template>

          <v-alert slot="no-results" :value="true" color="error" icon="warning">
            Your search for "{{ search }}" found no results.
          </v-alert>
        </v-data-table>
      </v-card>

      <v-card class="vote-card mt-2">
        <v-card-title>
          <div>
            <h3 class="headline mb-0">{{ $t('votes.summary_title') }}</h3>
            <div>
              {{ $t('votes.upvotes') }}: <strong>{{ numOfUpvotes }}</strong>,&nbsp;
              {{ $t('votes.downvotes') }}: <strong>{{ numOfDownvotes }}</strong>,&nbsp;
              {{ $t('votes.total_new_votes') }}: <strong>{{ numOfUpvotes + numOfDownvotes }} / {{ voteRequestLimit }}</strong>,&nbsp;
              {{ $t('votes.total_votes') }}: <strong>{{ totalVotes }} / {{ delegates.length }}</strong>
            </div>
          </div>
        </v-card-title>
        <v-card-text>
          <v-btn @click="sendVotes">
            {{ $t('votes.vote_button_text') }}
          </v-btn>
        </v-card-text>
      </v-card>

    </v-flex>

  </v-layout>
</template>

<script>
import AppToolbar from '@/components/AppToolbar'

export default {
  mounted () {
    this.$store.dispatch('delegates/getDelegates', {
      address: this.$store.state.address
    })
  },
  computed: {
    delegates () {
      const delegates = this.$store.state.delegates.delegates || {}

      return Object.values(delegates)
    },
    numOfUpvotes () {
      return this.delegates
        .filter(delegate => delegate.upvoted && !delegate.voted)
        .length
    },
    numOfDownvotes () {
      return this.delegates
        .filter(delegate => delegate.downvoted && delegate.voted)
        .length
    },
    totalVotes () {
      return this.delegates.filter(delegate => delegate._voted).length
    },
    delegateDetails () {
      return [
        {
          title: this.$t('votes.delegate_uptime'),
          value () {
            return this.productivity
          },
          format: value => `${value}%`
        },
        {
          title: this.$t('votes.delegate_approval'),
          value () {
            return this.approval
          },
          format: value => `${value}%`
        },
        {
          title: this.$t('votes.delegate_forging_time'),
          value () {
            return this.forgingTime
          },
          format: value => this.formatForgingTime(value)
        },
        {
          title: this.$t('votes.delegate_forged'),
          value () {
            return this.forged
          },
          format: value => `${this.$formatAmount(value).toFixed()} ADM`
        },
        {
          title: this.$t('votes.delegate_link'),
          value () {
            return this.link
          }
        },
        {
          title: this.$t('votes.delegate_description'),
          value () {
            return this.description
          }
        }
      ]
    }
  },
  data: () => ({
    voteRequestLimit: 30,
    search: '',
    headers: [
      { text: 'votes.table_head_name', value: 'username' },
      { text: 'votes.table_head_rank', value: 'rank' },
      { text: 'votes.table_head_vote', value: '_voted' },
      { text: '', value: 'expand' }
    ],
    pagination: {
      rowsPerPage: 10
    },
    waitingForConfirmation: false
  }),
  methods: {
    upVote (id) {
      this.$store.commit('delegates/upVote', id)
    },
    downVote (id) {
      this.$store.commit('delegates/downVote', id)
    },
    sendVotes () {
      if (!this.validateVotes()) {
        return
      }

      const upVotes = this.delegates
        .filter(delegate => delegate.upvoted && !delegate.voted)
        .map(delegate => `+${delegate.publicKey}`)
      const downVotes = this.delegates
        .filter(delegate => delegate.downvoted && delegate.voted)
        .map(delegate => `-${delegate.publicKey}`)
      const allVotes = [...upVotes, ...downVotes]

      if (allVotes.length <= 0) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('votes.select_delegates')
        })

        return
      }

      this.waitingForConfirmation = true

      this.$store.dispatch('delegates/voteForDelegates', {
        votes: [...upVotes, ...downVotes],
        address: this.$store.state.address
      })

      this.$store.dispatch('snackbar/show', {
        message: this.$t('votes.sent')
      })
    },
    validateVotes () {
      if (this.upvotedCount + this.downvotedCount > this.voteRequestLimit) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('votes.vote_request_limit', { limit: this.voteRequestLimit })
        })

        return false
      }

      if (this.$store.state.balance < 50) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('votes.no_money')
        })

        return false
      }

      return true
    },
    toggleDetails (delegate, props) {
      props.expanded = !props.expanded

      if (!props.expaned) {
        this.$store.dispatch('delegates/getForgedByAccount', delegate)
        this.$store.dispatch('delegates/getForgingTimeForDelegate', delegate)
      }
    },
    formatForgingTime (seconds) {
      if (!seconds) {
        return '...'
      }
      if (seconds === 0) {
        return this.$t('votes.now')
      }
      const minutes = Math.floor(seconds / 60)
      seconds = seconds - (minutes * 60)
      if (minutes && seconds) {
        return `${minutes} ${this.$t('votes.min')} ${seconds} ${this.$t('votes.sec')}`
      } else if (minutes) {
        return `${minutes} ${this.$t('votes.min')}`
      } else {
        return `${seconds} ${this.$t('votes.sec')}`
      }
    }
  },
  components: {
    AppToolbar
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

.theme--light
  .vote-card
    background-color: $grey.lighten-2
</style>
