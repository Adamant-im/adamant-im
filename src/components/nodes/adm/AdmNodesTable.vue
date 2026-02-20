<template>
  <NodesTableContainer>
    <NodesTableHead v-model="isAllNodesChecked" :indeterminate="isPartiallyChecked" />

    <tbody>
      <AdmNodesTableItem
        v-for="node in admNodes"
        :key="node.url"
        blockchain="adm"
        :node="node"
        @show-http-info="showHttpInfo = true"
      />
    </tbody>
  </NodesTableContainer>

  <v-dialog v-model="showHttpInfo" width="500">
    <v-card>
      <v-card-title class="a-text-header">
        {{ t('nodes.popup.http_restriction_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-4 a-text-regular-enlarged">
        <p class="mb-4">
          {{ t('nodes.popup.http_restriction_intro') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.http_vs_https_title') }}
        </h3>
        <p class="mb-4">
          {{ t('nodes.popup.http_vs_https_http') }}<br />
          {{ t('nodes.popup.http_vs_https_https') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.adamant_encryption_title') }}
        </h3>
        <p class="mb-4">
          {{ t('nodes.popup.adamant_encryption_text') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.how_to_allow_title') }}
        </h3>
        <ul class="ml-4">
          <li>{{ t('nodes.popup.how_to_allow_browser') }}</li>
          <li>{{ t('nodes.popup.how_to_allow_http_app') }}</li>
        </ul>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" class="a-btn-regular" @click="showHttpInfo = false">
          {{ t('nodes.popup.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import AdmNodesTableItem from './AdmNodesTableItem.vue'
import { sortNodesFn } from '@/components/nodes/utils/sortNodesFn'

const className = 'adm-nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTableContainer,
    NodesTableHead,
    AdmNodesTableItem
  },
  setup() {
    const store = useStore()

    const admNodes = computed(() => {
      const arr = store.getters['nodes/adm']

      return [...arr].sort(sortNodesFn)
    })
    const { t } = useI18n()
    const showHttpInfo = ref(false)

    const isAllNodesChecked = computed({
      get() {
        return admNodes.value.every((node) => node.active)
      },
      set(value) {
        store.dispatch('nodes/toggleAll', { nodesType: 'adm', active: value })
      }
    })

    const isPartiallyChecked = computed(() => {
      return (
        admNodes.value.some((node) => node.active) && admNodes.value.some((node) => !node.active)
      )
    })

    return {
      admNodes,
      classes,
      isAllNodesChecked,
      showHttpInfo,
      t,
      isPartiallyChecked
    }
  }
})
</script>

<style lang="scss"></style>
