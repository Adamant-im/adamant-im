<template>
  <v-text-field
    v-model.trim="computedSearch"
    :label="t('wallets.search')"
    :clearable="true"
    class="a-input"
    color="primary"
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

export default defineComponent({
  setup() {
    const { t } = useI18n()

    // it is cannot be just a ref cause of vuetify bug: https://github.com/vuetifyjs/vuetify/issues/4144
    const search = ref<string>('')

    const computedSearch = computed({
      get() {
        return search.value
      },
      set(newValue: string) {
        search.value = newValue ? newValue : ''
      }
    })
    return {
      computedSearch,
      t
    }
  }
})
</script>

<style scoped lang="scss"></style>
