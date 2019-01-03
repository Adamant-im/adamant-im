<template>
  <canvas :width="size" :height="size" ref="avatar"></canvas>
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

      // generate avatar by `publicKey` or `userId`
      if (this.usePublicKey) {
        getPublicKey(this.userId)
          .then(key => identicon.avatar(el, key, this.size))
      } else {
        identicon.avatar(el, this.userId, this.size)
      }
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
    },
    usePublicKey: {
      type: Boolean,
      default: false
    }
  }
}
</script>
