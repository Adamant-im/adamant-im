<template>
  <icon :width="sizePx" :height="sizePx" :color="fill">
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

import { Cryptos } from '@/lib/constants'

const SMALL_SIZE = 36
const MEDIUM_SIZE = 48
const LARGE_SIZE = 125

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
    DashFillIcon
  },
  props: {
    /** Crypto to show an icon for */
    crypto: {
      type: String,
      required: true,
      validator: value => !!Cryptos[value]
    },
    /** Icon size: can be either 'small' (36x36), 'medium' (48x48) or 'large' (125x125) or undefined */
    size: {
      type: String,
      validator: value => ['small', 'medium', 'large'].indexOf(value) >= 0
    },
    /** Fill color, e.g. '#BDBDBD' */
    fill: {
      type: String,
      default: undefined
    }
  },
  computed: {
    componentName () {
      return `${this.crypto.toLowerCase()}-fill-icon`
    },
    sizePx () {
      if (this.size === 'small') {
        return SMALL_SIZE
      } else if (this.size === 'medium') {
        return MEDIUM_SIZE
      } else if (this.size === 'large') {
        return LARGE_SIZE
      }
      return undefined
    }
  }
}

</script>
