<template>
  <canvas width="36" height="36" ref="avatar"></canvas>
</template>

<script>
import { getPublicKey } from '@/lib/adamant-api'
import Identicon from '@/lib/identicon'

export default {
  mounted () {
    this.generateAvatar()
  },
  methods: {
    generateAvatar () {
      const el = this.$refs.avatar
      const identicon = new Identicon()

      getPublicKey(this.userId)
        .then(key => identicon.avatar(el, key, this.size))
    }
  },
  props: {
    size: {
      type: Number,
      default: 36
    },
    userId: {
      type: String,
      required: true
    }
  }
}
</script>
