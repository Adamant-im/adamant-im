import { onBeforeUnmount, onMounted } from 'vue'
import { useStore } from 'vuex'

const RESUME_DEBOUNCE_MS = 1_500
const SLEEP_GAP_THRESHOLD_MS = 20_000
const HEARTBEAT_INTERVAL_MS = 5_000

export function useHealthcheckResume() {
  const store = useStore()

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let lastResumeAt = 0
  let lastHeartbeatAt = Date.now()

  const resumeHealthchecks = () => {
    const now = Date.now()

    if (now - lastResumeAt < RESUME_DEBOUNCE_MS) {
      return
    }

    lastResumeAt = now
    void store.dispatch('nodes/updateStatus')
    void store.dispatch('services/updateStatus')
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      resumeHealthchecks()
    }
  }

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted || document.visibilityState === 'visible') {
      resumeHealthchecks()
    }
  }

  const onAppResume = () => {
    resumeHealthchecks()
  }

  onMounted(() => {
    resumeHealthchecks()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onAppResume)
    window.addEventListener('online', onAppResume)
    document.addEventListener('resume', onAppResume)

    heartbeatTimer = setInterval(() => {
      const now = Date.now()
      const hasSleepGap = now - lastHeartbeatAt > SLEEP_GAP_THRESHOLD_MS

      if (hasSleepGap && document.visibilityState === 'visible') {
        resumeHealthchecks()
      }

      lastHeartbeatAt = now
    }, HEARTBEAT_INTERVAL_MS)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('focus', onAppResume)
    window.removeEventListener('online', onAppResume)
    document.removeEventListener('resume', onAppResume)

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  })
}
