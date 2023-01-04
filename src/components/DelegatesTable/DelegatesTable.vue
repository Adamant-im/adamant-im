<template>
  <v-table :class="classes.root">
    <delegates-table-head />

    <tbody>
      <template v-if="searchDelegates.length > 0">
        <delegates-table-item
          v-for="(delegate, i) in searchDelegates"
          :key="delegate.username"
          :delegate="delegate"
          :details-expanded="expandedDelegateIndex === i"
          @update:details-expanded="state => { updateExpandedDelegateIndex(i)(state) }"
        />
      </template>

      <delegates-not-found
        v-else
        :search-query="searchQuery"
      />
    </tbody>
  </v-table>
</template>

<script>
import { computed, defineComponent, reactive, ref, toRefs } from 'vue'
import { useStore } from 'vuex'
import DelegatesTableItem from '@/components/DelegatesTable/DelegatesTableItem'
import DelegatesTableHead from '@/components/DelegatesTable/DelegatesTableHead'
import DelegatesNotFound from '@/components/DelegatesTable/DelegatesNotFound'

/**
 * Generate sorting function passed to `Array.prototype.sort`
 *
 * @param {("username" | "rank" | "_voted")} sortBy Sort array by column
 * @returns {(left: unknown, right: unknown) => number}
 */
function sortDelegatesByColumnCompareFn (sortBy) {
  return (left, right) => left[sortBy] - right[sortBy]
}

/**
 * Filter by username callback passed to `Array.prototype.filter`
 *
 * @param {unknown} searchQuery
 * @returns {(delegate: unknown) => boolean}
 */
function filterDelegatesFn (searchQuery) {
  return delegate => delegate.username.includes(searchQuery)
}

export default defineComponent({
  components: {
    DelegatesNotFound,
    DelegatesTableHead,
    DelegatesTableItem
  },
  props: {
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
  setup (props) {
    const { searchQuery, page, perPage, sortBy } = toRefs(props)
    const store = useStore()
    const delegates = computed(() => Object.values(store.state.delegates.delegates || {}))

    const expandedDelegateIndex = ref(0)
    const updateExpandedDelegateIndex = (delegateId) => (state) => {
      console.log('is working', delegateId, state)
      expandedDelegateIndex.value = state ? delegateId : -1
    }

    const searchDelegates = computed(
      () => {
        const startIndex = (page.value - 1) * perPage.value
        const endIndex = startIndex + perPage.value

        const filteredDelegates = [...delegates.value]
          .sort(sortDelegatesByColumnCompareFn(sortBy.value))
          .filter(filterDelegatesFn(searchQuery.value))
          .slice(startIndex, endIndex)

        return reactive(filteredDelegates)
      }
    )

    const className = 'delegates-table'
    const classes = {
      root: className
    }

    return {
      delegates,
      searchDelegates,
      classes,
      expandedDelegateIndex,
      updateExpandedDelegateIndex
    }
  }
})
</script>

<style lang="scss">
@import '~vuetify/settings';

.delegates-table {

}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .delegates-table {

  }
}

.v-theme--dark {
  .delegates-table {
    background-color: rgb(var(--v-theme-on-surface-variant));
  }
}
</style>
