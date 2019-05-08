<template>
  <icon :width="sizePx" :height="sizePx" :fill="fillColor">
    <component :is="componentName"/>
  </icon>
</template>

<script>
import Icon from './BaseIcon'
import AdmFillIcon from './AdmFill'
import BnbFillIcon from './BnbFill'
import EthFillIcon from './EthFill'
import BzFillIcon from './BnzFill'
import DogeFillIcon from './DogeFill'
import DashFillIcon from './DashFill'
import KcsFillIcon from './KcsFill'

import { Cryptos } from '@/lib/constants'

const SMALL_SIZE = 36
const LARGE_SIZE = 125

const DEFAULT_FILL = '#BDBDBD'

/**
 * Displays a crypto icon
 */
export default {
  components: {
    Icon,
    AdmFillIcon,
    BnbFillIcon,
    EthFillIcon,
    BzFillIcon,
    DogeFillIcon,
    DashFillIcon,
    KcsFillIcon
  },
  props: {
    /** Crypto to show an icon for */
    crypto: {
      type: String,
      required: true,
      validator: value => !!Cryptos[value]
    },
    /** Icon size: can be either 'small' (36x36) or 'large' (125x125) or undefined */
    size: {
      type: String,
      validator: value => ['small', 'large'].indexOf(value) >= 0
    },
    /** Fill color, e.g. '#BDBDBD' */
    fill: {
      type: String,
      default: DEFAULT_FILL
    }
  },
  computed: {
    componentName () {
      return `${this.crypto.toLowerCase()}-fill-icon`
    },
    sizePx () {
      if (this.size === 'small') {
        return SMALL_SIZE
      } else if (this.size === 'large') {
        return LARGE_SIZE
      }
      return undefined
    },
    fillColor () {
      return this.fill || DEFAULT_FILL
    }
  }
}

</script>
