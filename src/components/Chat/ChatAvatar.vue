<template>
  <div>
    <img v-if="avatar" :src="avatar" :width="size" :height="size"/>
    <canvas
      :width="size"
      :height="size"
      :style="{ display: 'none' }"
      ref="avatar"
    ></canvas>
  </div>
</template>

<script>
import { getPublicKey } from '@/lib/adamant-api'
import Identicon from '@/lib/identicon'

export default {
  mounted () {
    this.getAvatar()
  },
  computed: {
    avatar () {
      return this.$store.getters['identicon/avatar'](this.userId)
    },
    isAvatarCached () {
      return this.$store.getters['identicon/isAvatarCached'](this.userId)
    }
  },
  methods: {
    /**
     * Creates and saves avatar Base64 data
     * to store, if is not cached.
     */
    getAvatar () {
      if (!this.isAvatarCached) {
        this.getBase64Image()
          .then(Base64 => {
            this.$store.dispatch('identicon/saveAvatar', {
              userId: this.userId,
              Base64
            })
          })
      }
    },
    /**
     * Returns Base64 image data using hidden canvas.
     * @returns {Promise<string>} Base64 data
     */
    getBase64Image () {
      const el = this.$refs.avatar
      const identicon = new Identicon()

      // generate avatar by `publicKey` or `userId`
      if (this.usePublicKey) {
        return getPublicKey(this.userId)
          .then(key => {
            identicon.avatar(el, key, this.size)

            return el.toDataURL()
          })
      } else {
        identicon.avatar(el, this.userId, this.size)
      }

      return Promise.resolve(el.toDataURL())
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
