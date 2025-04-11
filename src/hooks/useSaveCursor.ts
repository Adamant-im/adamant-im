import { watch, type Ref, type ShallowRef } from 'vue'

export function useSaveCursor(
  inputRef: Readonly<ShallowRef<HTMLInputElement | null>>,
  trigger: Ref<boolean>
) {
  watch(trigger, () => {
    const inputElement = inputRef.value
    if (inputElement) {
      const cursorPosition = inputElement.selectionStart || 0

      requestAnimationFrame(() => {
        inputElement.setSelectionRange(cursorPosition, cursorPosition)
        inputElement.focus()
      })
    }
  })
}
