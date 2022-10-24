<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('votes.page_title')"
      flat
    />

    <v-container
      fluid
      class="pa-0"
    >
      <v-row
        justify="center"
        no-gutters
      >
        <container>
          <v-card
            flat
            class="transparent"
          >
            <v-card-title class="pa-0">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                :label="$t('votes.search')"
                :class="`${className}__search`"
                single-line
                hide-details
                class="a-input"
              />
            </v-card-title>

            <div :class="`${className}__spacer`" />

            <v-data-table
              :headers="headers"
              :page.sync="pagination.page"
              :items-per-page.sync="pagination.rowsPerPage"
              :sort-by.sync="pagination.sortBy"
              :items="delegates"
              :footer-props="{
                'items-per-page-text': $t('rows_per_page')
              }"
              :search="search"
              hide-default-footer
              must-sort
              item-key="username"
              :expanded.sync="expanded"
              single-expand
              mobile-breakpoint="0"
            >
              <template #no-data>
                <v-row
                  align="center"
                  justify="center"
                  no-gutters
                >
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="24"
                    class="mr-4"
                  />
                  <div
                    class="a-text-regular"
                    style="line-height:1"
                  >
                    {{ waitingForConfirmation ? $t('votes.waiting_confirmations') : $t('votes.loading_delegates') }}
                  </div>
                </v-row>
              </template>

              <template #[`item.username`]="props">
                <td
                  :class="`${className}__body`"
                  class="pr-0"
                  style="cursor:pointer"
                  @click="toggleDetails(props.item, props)"
                >
                  {{ props.item.username }}
                </td>
              </template>

              <template #[`item.rank`]="props">
                <td :class="`${className}__body`">
                  {{ props.item.rank }}
                </td>
              </template>

              <template #[`item._voted`]="props">
                <td>
                  <v-icon
                    v-if="props.item._voted"
                    @click="downVote(props.item.address)"
                  >
                    mdi-thumb-up
                  </v-icon>
                  <v-icon
                    v-else
                    @click="upVote(props.item.address)"
                  >
                    mdi-thumb-up-outline
                  </v-icon>
                </td>
              </template>

              <template #expanded-item="props">
                <td
                  colspan="3"
                  class="pa-0"
                >
                  <v-card
                    flat
                    :class="`${className}__expand`"
                  >
                    <v-list
                      :class="`${className}__expand-list`"
                      dense
                    >
                      <v-list-item :class="`${className}__expand-list-tile`">
                        <v-list-item-content>
                          <v-list-item-title :class="`${className}__expand-list-address`">
                            <a
                              :href="getExplorerUrl() + props.item.address"
                              target="_blank"
                              rel="noopener"
                            >
                              {{ props.item.address }}
                            </a>
                          </v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>

                      <v-list-item
                        v-for="(item, i) in delegateDetails"
                        :key="i"
                        :class="`${className}__expand-list-tile`"
                      >
                        <v-list-item-content>
                          <v-list-item-title>
                            {{ item.title }}
                          </v-list-item-title>
                        </v-list-item-content>
                        <v-list-item-content>
                          <v-list-item-title class="a-text-explanation text-right">
                            {{ item.format ? item.format(item.value.call(props.item)) : item.value.call(props.item) }}
                          </v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </td>
              </template>

              <template #no-results>
                <v-alert
                  :class="`${className}__alert mt-4`"
                  :value="true"
                  icon="mdi-alert"
                >
                  Your search for "{{ search }}" found no results.
                </v-alert>
              </template>
            </v-data-table>

            <v-row
              :class="`${className}__review`"
              align="center"
              justify="space-between"
              no-gutters
            >
              <pagination
                v-if="showPagination"
                v-model="pagination.page"
                :pages="pages"
              />

              <v-btn
                :disabled="reviewButtonDisabled"
                class="a-btn-primary ma-2"
                @click="showConfirmationDialog"
              >
                {{ $t('votes.summary_title') }}
              </v-btn>
            </v-row>
          </v-card>
        </container>
      </v-row>
    </v-container>

    <v-dialog
      v-model="dialog"
      width="500"
    >
      <v-card>
        <v-card-title
          :class="`${className}__dialog-title`"
        >
          {{ $t('votes.summary_title') }}
        </v-card-title>

        <v-divider :class="`${className}__divider`" />

        <v-row
          no-gutters
          class="pa-4"
        >
          <div :class="`${className}__dialog-summary`">
            {{ $t('votes.upvotes') }}: <strong>{{ numOfUpvotes }}</strong>,&nbsp;
            {{ $t('votes.downvotes') }}: <strong>{{ numOfDownvotes }}</strong>,&nbsp;
            {{ $t('votes.total_new_votes') }}: <strong>{{ numOfUpvotes + numOfDownvotes }} / {{ voteRequestLimit }}</strong>,&nbsp;
            {{ $t('votes.total_votes') }}: <strong>{{ totalVotes }} / {{ delegates.length }}</strong>
          </div>
          <!-- eslint-disable vue/no-v-html -- Safe internal content -->
          <div
            :class="`${className}__dialog-info`"
            v-html="$t('votes.summary_info')"
          />
          <!-- eslint-enable vue/no-v-html -->
        </v-row>

        <v-card-actions>
          <v-spacer />

          <v-btn
            text
            class="a-btn-regular"
            @click="dialog = false"
          >
            {{ $t('transfer.confirm_cancel') }}
          </v-btn>

          <v-btn
            text
            class="a-btn-regular"
            @click="sendVotes"
          >
            {{ $t('votes.vote_button_text') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import AppToolbarCentered from '@/components/AppToolbarCentered'
import Pagination from '@/components/Pagination'
import numberFormat from '@/filters/numberFormat'
import { explorerUriToOnion } from '@/lib/uri'

export default {
  components: {
    AppToolbarCentered,
    Pagination
  },
  data: () => ({
    voteRequestLimit: 30,
    search: '',
    pagination: {
      rowsPerPage: 50,
      sortBy: 'rank',
      page: 1
    },
    expanded: [],
    waitingForConfirmation: false,
    dialog: false
  }),
  computed: {
    className: () => 'delegates-view',
    headers () {
      return [
        { text: this.$t('votes.table_head_name'), value: 'username' },
        { text: this.$t('votes.table_head_rank'), value: 'rank' },
        { text: this.$t('votes.table_head_vote'), value: '_voted' }
      ]
    },
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
          title: this.$t('votes.delegate_forged'),
          value () {
            return this.forged
          },
          format: value => `${numberFormat(value / 1e8, 1)} ADM`
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
    },
    pages () {
      if (this.delegates.length <= 0) {
        return 0
      }

      return Math.ceil(this.delegates.length / this.pagination.rowsPerPage)
    },
    showPagination () {
      return this.search.length === 0
    },
    reviewButtonDisabled () {
      return (this.numOfUpvotes + this.numOfDownvotes) === 0
    }
  },
  mounted () {
    this.$store.dispatch('delegates/getDelegates', {
      address: this.$store.state.address
    })
  },
  methods: {
    getExplorerUrl () {
      return explorerUriToOnion('https://explorer.adamant.im/delegate/')
    },
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
      this.dialog = false

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
      const isExpanded = this.expanded.find(item => item === delegate)

      if (isExpanded) {
        this.expanded = []
      } else {
        this.expanded = [delegate]
      }

      if (!isExpanded) {
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
    },
    showConfirmationDialog () {
      this.dialog = true
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '~vuetify/src/styles/settings/_colors.scss';
@import '../assets/styles/settings/_colors.scss';

.delegates-view {
  &__body {
    font-size: 14px;
    font-weight: 300;
    padding: 0 16px !important;
  }
  &__dialog-title {
    @include a-text-header();
  }
  &__dialog-summary {
    @include a-text-regular-enlarged();
  }
  &__dialog-info {
    @include a-text-regular-enlarged();
    margin-top: 16px;
    :deep(a) {
      text-decoration-line: none;&:hover {
        text-decoration-line: underline;
      }
    }
  }
  &__expand {
    margin: 20px;
  }
  &__expand-list-tile {
    height: 36px;
    :deep(.v-list__tile) {
      padding-left: 20px;
      padding-right: 20px;
    }
  }
  &__expand-list-address {
    font-size: 16px !important;
  }
  &__review {
    padding-top: 15px !important;
    padding-bottom: 15px !important;
  }
  &__search {
    :deep(.v-input__slot) {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
  &__spacer {
    height: 20px;
    margin-top: 5px;
  }
  &__alert {
    border: none;
  }
  :deep(table.v-table) thead th:not(:nth-child(1)),
  :deep(table.v-table) tbody td:not(:nth-child(1)) {
    padding: 0 16px;
  }
}

/** Themes **/
.theme--light {
  .delegates-view {
    &__body {
      color: map-get($adm-colors, 'regular');
    }
    &__dialog-title {
      color: map-get($adm-colors, 'regular');
    }
    &__dialog-summary {
      color: map-get($adm-colors, 'regular');
    }
    &__dialog-info {
      color: map-get($adm-colors, 'regular');
    }
    &__expand {
      background-color: map-get($adm-colors, 'secondary2');
      :deep(.a-text-active) a {
        color: map-get($adm-colors, 'regular');
      }
    }
    &__expand-list {
      background-color: transparent;
    }
    &__divider {
      border-color: map-get($adm-colors, 'secondary');
    }
    &__alert {
      background-color: map-get($adm-colors, 'muted') !important;
      :deep(.v-icon) {
        color: map-get($shades, 'white');
      }
    }
    :deep(.v-table) tbody tr:not(:last-child) {
      border-bottom: 1px solid, map-get($adm-colors, 'secondary2');
    }
    :deep(tfoot) {
      @include linear-gradient-light();
    }
  }
}
.theme--dark {
  .delegates-view {
    &__alert {
      background-color: map-get($adm-colors, 'muted') !important;
      :deep(.v-icon) {
        color: map-get($shades, 'white');
      }
    }
    :deep(tfoot) {
      @include linear-gradient-dark();
    }
  }
}
</style>
