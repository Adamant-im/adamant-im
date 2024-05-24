<template>
  <v-text-field
    v-model.trim="computedSearch"
    :label="t('wallets.search')"
    :clearable="true"
    :class="`${classes.root}__search`"
    class="a-input"
    color="primary"
    :single-line="true"
    type="text"
    variant="underlined"
    @input="$emit('change', computedSearch)"
    @click:clear="$emit('change', computedSearch)"
  >
  </v-text-field>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const className = 'wallets-view'
const classes = {
  root: className
}

export default defineComponent({
  setup() {
    const { t } = useI18n()

    // it is cannot be just a ref cause of vuetify bug: https://github.com/vuetifyjs/vuetify/issues/4144
    const search = ref('')

    const computedSearch = computed({
      get() {
        return search.value
      },
      set(newValue: string) {
        search.value = newValue || ''
      }
    })
    return {
      classes,
      computedSearch,
      t
    }
  }
})
</script>

<style lang="scss" scoped>
.wallets-view {
  &__search {
    :deep(.v-field) {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
}
</style>
