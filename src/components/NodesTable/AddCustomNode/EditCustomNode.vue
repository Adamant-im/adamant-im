<template>
  <CustomNodeDialog v-model="open">
    <template #activator="{ props }">
      <slot name="activator" :props="props" />
    </template>

    <template #input>
      <NodeHostInput v-model="nodeHost" />
    </template>

    <template #submit>
      <v-btn variant="text" class="a-btn-regular" :disabled="!isValidNode" @click="submit">
        {{ $t('nodes.custom_node.form.submit_button_title') }}
      </v-btn>
    </template>
  </CustomNodeDialog>
</template>

<script lang="ts">
import { ref } from 'vue'
import CustomNodeDialog from './components/CustomNodeDialog.vue'
import NodeHostInput from './components/NodeHostInput.vue'
import { useCustomNodeForm } from './hooks/useCustomNodeForm'

export default {
  components: { NodeHostInput, CustomNodeDialog },
  props: {
    host: {
      type: String
    }
  },
  emits: ['submit'],
  setup(props, { emit }) {
    const open = ref(false)

    const { nodeHost, isValidNode } = useCustomNodeForm(props.host)
    const submit = () => emit('submit', nodeHost)

    return {
      open,
      nodeHost,
      isValidNode,
      submit
    }
  }
}
</script>
