import { computed, ref } from 'vue'

export function useCustomNodeForm(defaultHost = '') {
  const nodeHost = ref(defaultHost)

  const isValidNode = computed(() => {
    const isNotEmpty = nodeHost.value.length > 0
    const isValidURL = /^https?:\/\/[\w]+\.[\w.]+$/.test(nodeHost.value)

    return isNotEmpty && isValidURL
  })

  return {
    nodeHost,
    isValidNode
  }
}
