<template>
  <i
    class="icon"
    :class="{ 'v-icon--link': isClickable }"
  >
    <svg
      class="svg-icon"
      xmlns="http://www.w3.org/2000/svg"
      :width="width"
      :height="height"
      :viewBox="viewBox"
      :shape-rendering="shapeRendering"
      :aria-labelledby="title"
      role="presentation"
      @click="$emit('click')"
    >
      <title v-if="title">{{ title }}</title>
      <g :fill="color">
        <slot />
      </g>
    </svg>
  </i>
</template>

<script>
export default {
  props: {
    width: {
      type: [Number, String],
      default: 32
    },
    height: {
      type: [Number, String],
      default: 32
    },
    title: {
      type: String
    },
    color: {
      type: String,
      default: undefined
    },
    viewBox: {
      type: String,
      default: '0 0 512 512'
    },
    shapeRendering: {
      type: String,
      default: 'auto'
    }
  },
  data: () => ({
    isClickable: false
  }),
  created () {
    // if component has @click attr, make cursor: pointer
    const listeners = Object.keys(this.$listeners)
    const hasClickAttr = listeners.some(
      listener => /^click/.test(listener)
    )

    if (hasClickAttr) {
      this.isClickable = true
    }
  }
}
</script>

<style lang="scss">
@import '~vuetify/src/styles/settings/_colors.scss';

.icon {
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  display: inline-flex;
  font-size: 24px;
  justify-content: center;
  letter-spacing: normal;
  line-height: 1;
  position: relative;
  text-indent: 0;
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1), visibility 0s;
  vertical-align: middle;
  user-select: none;
}

/* Themes */
.theme--light {
  .svg-icon {
    fill: rgba(0, 0, 0, 0.54);
    stroke: rgba(0, 0, 0, 0.54);
  }
}
.theme--dark {
  .svg-icon {
    fill: map-get($shades, 'white');
    stroke: map-get($shades, 'white');
  }
}
</style>
