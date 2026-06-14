export const LONG_RUNNING_TEST_THRESHOLD_MS = 40_000
export const LONG_RUNNING_TEST_TAG = '@long-running'

export const longRunningTestTitle = (title: string, observedDurationMs: number) => {
  if (observedDurationMs <= LONG_RUNNING_TEST_THRESHOLD_MS) {
    throw new Error(
      `Long-running tests must exceed ${LONG_RUNNING_TEST_THRESHOLD_MS} ms; received ${observedDurationMs} ms`
    )
  }

  return `${title} ${LONG_RUNNING_TEST_TAG}`
}
