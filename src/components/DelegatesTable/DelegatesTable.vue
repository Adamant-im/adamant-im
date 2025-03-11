<template>
  <v-table :class="classes.root">
    <delegates-table-head />
    <tbody>
      <template v-if="searchDelegates.length > 0">
        <delegates-table-item
          v-for="delegate in searchDelegates"
          :key="delegate.username"
          :delegate="delegate"
          :details-expanded="expandedDelegateUsername === delegate.username"
          @update:details-expanded="
            (state) => updateExpandedDelegateUsername(delegate.username)(state)
          "
        />
      </template>
      <delegates-loader
        v-else-if="delegates.length === 0"
        :waiting-for-confirmation="waitingForConfirmation"
      />
      <delegates-not-found v-else :search-query="searchQuery" />
    </tbody>
  </v-table>
</template>

<script>
import { computed, defineComponent, reactive, ref, toRefs } from 'vue'
import { useStore } from 'vuex'
import DelegatesTableItem from './DelegatesTableItem.vue'
import DelegatesTableHead from './DelegatesTableHead.vue'
import DelegatesNotFound from './DelegatesNotFound.vue'
import DelegatesLoader from './DelegatesLoader.vue'

/**
 * Generate sorting function passed to `Array.prototype.sort`
 *
 * @param {("username" | "rank" | "_voted")} sortBy Sort array by column
 * @returns {(left: unknown, right: unknown) => number}
 */
function sortDelegatesByColumnCompareFn(sortBy) {
  return (left, right) => left[sortBy] - right[sortBy]
}

/**
 * Filter by username callback passed to `Array.prototype.filter`
 *
 * @param {unknown} searchQuery
 * @returns {(delegate: unknown) => boolean}
 */
function filterDelegatesFn(searchQuery) {
  return (delegate) => delegate.username.includes(searchQuery)
}

export default defineComponent({
  components: {
    DelegatesNotFound,
    DelegatesTableHead,
    DelegatesTableItem,
    DelegatesLoader
  },
  props: {
    waitingForConfirmation: {
      type: Boolean,
      required: true
    },
    searchQuery: {
      type: String,
      required: true
    },
    page: {
      type: Number,
      required: true
    },
    perPage: {
      type: Number,
      required: false,
      default: 50
    },
    sortBy: {
      /** @enum {("username" | "rank" | "_voted")} **/
      type: String,
      required: false,
      default: 'rank'
    }
  },
  setup(props) {
    const { searchQuery, page, perPage, sortBy } = toRefs(props)
    const store = useStore()
    const delegates = computed(() => Object.values(store.state.delegates.delegates || {}))

    const expandedDelegateUsername = ref(0)
    const updateExpandedDelegateUsername = (delegateUsername) => (state) => {
      expandedDelegateUsername.value = state ? delegateUsername : -1
    }

    const searchDelegates = computed(() => {
      const startIndex = (page.value - 1) * perPage.value
      const endIndex = startIndex + perPage.value

      const filteredDelegates = [...delegates.value]
        .sort(sortDelegatesByColumnCompareFn(sortBy.value))
        .filter(filterDelegatesFn(searchQuery.value))
        .slice(startIndex, endIndex)

      return reactive(filteredDelegates)
    })

    const className = 'delegates-table'
    const classes = {
      root: className
    }

    return {
      delegates,
      searchDelegates,
      classes,
      expandedDelegateUsername,
      updateExpandedDelegateUsername
    }
  }
})
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.delegates-table {
}

@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .delegates-table {
  }
}

.v-theme--dark {
  .delegates-table {
    background-color: map.get(colors.$adm-colors, 'black2');
  }
}
</style>
