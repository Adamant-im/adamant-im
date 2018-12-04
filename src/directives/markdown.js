import renderMarkdown from '@/lib/markdown'

/**
 * @todo Need to optimize re-render with :key attribute.
 */
export default {
  bind (el, binding) {
    el.innerHTML = renderMarkdown(binding.value)
  },
  update (el, binding) {
    if (binding.oldValue !== binding.value) {
      el.innerHTML = renderMarkdown(binding.value)
    }
  }
}
