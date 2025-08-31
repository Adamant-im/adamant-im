import { REACT_EMOJIS } from '@/lib/constants'

const EMOJI_WEIGHT_STORE_KEY = 'emojiWeight'
const DEFAULT_EMOJI_WEIGHT_MAP = {
  [REACT_EMOJIS.FACE_WITH_TEARS_OF_JOY]: 3,
  [REACT_EMOJIS.FIRE]: 3,
  [REACT_EMOJIS.GRINNING_FACE_WITH_SMILING_EYES]: 3,
  [REACT_EMOJIS.THUMB_UP]: 2,
  [REACT_EMOJIS.OK_HAND]: 2,
  [REACT_EMOJIS.RED_HEART]: 2,
  [REACT_EMOJIS.SLIGHTLY_SMILING_FACE]: 2,
  [REACT_EMOJIS.THINKING_FACE]: 2,
  [REACT_EMOJIS.WAVING_HAND]: 2,
  [REACT_EMOJIS.FOLDED_HANDS]: 2,
  [REACT_EMOJIS.FLUSHED_FACE]: 2,
  [REACT_EMOJIS.PARTY_POPPER]: 2
}

export const emojiWeight = {
  getMap() {
    const textJson = localStorage.getItem(EMOJI_WEIGHT_STORE_KEY)

    if (!textJson) return DEFAULT_EMOJI_WEIGHT_MAP

    try {
      const emojidWeightMap = JSON.parse(textJson)

      const weightMap = {
        ...DEFAULT_EMOJI_WEIGHT_MAP,
        ...emojidWeightMap
      }

      return weightMap
    } catch {
      // reset store item
      localStorage.setItem(EMOJI_WEIGHT_STORE_KEY, JSON.stringify(DEFAULT_EMOJI_WEIGHT_MAP))

      return DEFAULT_EMOJI_WEIGHT_MAP
    }
  },
  getEmojis() {
    return Object.entries(this.getMap())
      .sort(([, leftWeight], [, rightWeight]) => rightWeight - leftWeight)
      .reduce((acc, [emoji]) => {
        return [...acc, emoji]
      }, [])
  },
  save(weightMap) {
    localStorage.setItem(EMOJI_WEIGHT_STORE_KEY, JSON.stringify(weightMap))
  },
  addReaction(emoji) {
    const weightMap = this.getMap()

    const weight = weightMap[emoji] || 0
    weightMap[emoji] = weight + 4

    this.save(weightMap)
  },
  removeReaction(emoji) {
    const weightMap = this.getMap()

    const weight = weightMap[emoji] || 0
    weightMap[emoji] = weight - 2

    this.save(weightMap)
  }
}
