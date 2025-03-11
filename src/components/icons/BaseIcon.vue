<template>
  <i
    class="icon"
    :class="{
      'icon--link': isClickable,
      'icon--box-centered': boxCentered,
      [$attrs.class]: !!$attrs.class
    }"
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
      @click="$attrs.onClick"
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
  inheritAttrs: false,
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
    },
    /** Center icon inside a box 40x40px **/
    boxCentered: {
      type: Boolean,
      default: undefined
    }
  },
  data: () => ({}),
  computed: {
    isClickable() {
      return !!this.$attrs.onClick
    }
  }
}
</script>

<style lang="scss">
@use 'sass:map';
@use 'vuetify/settings';

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
  transition:
    0.3s cubic-bezier(0.25, 0.8, 0.5, 1),
    visibility 0s;
  vertical-align: middle;
  user-select: none;
}

.icon--link {
  cursor: pointer;
}

.icon--box-centered {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Themes */
.v-theme--light {
  .svg-icon {
    fill: rgba(0, 0, 0, 0.54);
    stroke: rgba(0, 0, 0, 0.54);
  }
}
.v-theme--dark {
  .svg-icon {
    fill: map.get(settings.$shades, 'white');
    stroke: map.get(settings.$shades, 'white');
  }
}
</style>
