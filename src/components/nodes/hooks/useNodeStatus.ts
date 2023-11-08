import { computed, Ref } from 'vue'
import { useI18n, VueI18nTranslation } from 'vue-i18n'

import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { NodeStatus } from '@/lib/nodes/types'

type StatusColor = 'green' | 'red' | 'grey' | 'orange'

function getNodeStatusTitle(node: NodeStatusResult, t: VueI18nTranslation) {
  const i18n: Record<NodeStatus, string> = {
    online: node.ping + ' ' + t('nodes.ms'),
    offline: 'nodes.offline',
    disabled: 'nodes.inactive',
    sync: 'nodes.sync',
    unsupported_version: 'nodes.unsupported'
  }
  const i18nKey = i18n[node.status]

  return t(i18nKey)
}

function getNodeStatusText(node: NodeStatusResult, t: VueI18nTranslation) {
  if (node.online) {
    return t('nodes.height') + ': ' + node.height
  }

  if (!node.hasMinNodeVersion) {
    return t('nodes.unsupported_reason_api_version')
  } else if (!node.hasSupportedProtocol) {
    return t('nodes.unsupported_reason_protocol')
  }

  return ''
}

function getNodeStatusColor(node: NodeStatusResult) {
  const statusColorMap: Record<NodeStatus, StatusColor> = {
    online: 'green',
    unsupported_version: 'red',
    disabled: 'grey',
    offline: 'red',
    sync: 'orange'
  }

  return statusColorMap[node.status]
}

type UseNodeStatusResult = {
  nodeStatusTitle: Ref<string>
  nodeStatusText: Ref<string>
  nodeStatusColor: Ref<StatusColor>
}

export function useNodeStatus(node: Ref<NodeStatusResult>): UseNodeStatusResult {
  const { t } = useI18n()

  const nodeStatusTitle = computed(() => getNodeStatusTitle(node.value, t))
  const nodeStatusText = computed(() => getNodeStatusText(node.value, t))
  const nodeStatusColor = computed(() => getNodeStatusColor(node.value))

  return {
    nodeStatusTitle,
    nodeStatusText,
    nodeStatusColor
  }
}
