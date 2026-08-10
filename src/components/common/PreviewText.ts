import { defineComponent, h, type VNode, type VNodeArrayChildren } from 'vue'

import { LINE_BREAK_SYMBOL } from '@/lib/markdown'

/**
 * Renders a single-line message preview as plain text.
 *
 * The line-break symbol is emitted as a real `<span>` VNode instead of being spliced
 * into an HTML string, so preview text never has to pass through an HTML sink.
 */
export default defineComponent({
  name: 'PreviewText',
  props: {
    text: {
      type: String,
      default: ''
    },
    tag: {
      type: String,
      default: 'span'
    }
  },
  setup(props) {
    return (): VNode => {
      const parts = props.text.split(LINE_BREAK_SYMBOL)
      const children: VNodeArrayChildren = []

      parts.forEach((part, index) => {
        if (index > 0) {
          children.push(h('span', { class: 'arrow-return' }, LINE_BREAK_SYMBOL))
        }

        if (part) children.push(part)
      })

      return h(props.tag, children)
    }
  }
})
