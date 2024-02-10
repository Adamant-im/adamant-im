<template>
  <v-dialog v-model="showDialog" width="500">
    <v-card>
      <v-card-title class="a-text-header">
        {{ t('chats.nodes_offline_dialog.title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text>
        <span v-html="t('chats.nodes_offline_dialog.text', { coin: nodeType.toUpperCase() })" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn to="/options/nodes" variant="text" prepend-icon="mdi-open-in-new">{{
          t('chats.nodes_offline_dialog.open_nodes_button')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { computed, PropType, ref, watch } from 'vue'
import { NodeType } from '@/lib/nodes/types'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

const className = 'all-nodes-disabled-dialog'
const classes = {
  root: className
}

export default {
  props: {
    nodeType: {
      type: String as PropType<NodeType>,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup() {
    const { t } = useI18n()
    const store = useStore()

    const showDialog = ref(false)

    const nodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
    const allNodesOffline = computed(() => {
      return nodes.value.every((node) => !node.online)
    })

    watch(allNodesOffline, (isOffline) => {
      showDialog.value = isOffline
    })

    return {
      t,
      classes,
      allNodesOffline,
      showDialog
    }
  }
}
</script>
