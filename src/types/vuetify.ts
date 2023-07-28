/**
 * @see https://vuetifyjs.com/en/api/v-touch/
 */
export type VuetifyTouchEvent = { originalEvent: TouchEvent } & {
  touchstartX: number
  touchstartY: number
  touchmoveX: number
  touchmoveY: number
  touchendX: number
  touchendY: number
  offsetX: number
  offsetY: number
}
