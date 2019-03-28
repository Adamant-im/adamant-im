<template>
  <v-dialog
    v-model="show"
    :class="className"
    width="500"
  >
    <v-card>

      <!-- Camera Waiting -->
      <v-layout
        v-if="cameraStatus === 'waiting'"
        justify-center
        align-center
        class="pa-5"
      >
        <div class="title">{{ $t('scan.waiting_camera') }}</div>
        <v-progress-circular
          indeterminate
          color="primary"
          size="32"
          class="ml-3"
        />
      </v-layout>

      <!-- Camera Active -->
      <v-layout
        v-show="cameraStatus === 'active'"
        row
        wrap
      >
        <v-flex xs12>
          <div :class="`${className}__camera`">
            <video ref="camera"></video>
            <v-menu
              v-if="cameras.length > 1"
              offset-y
              :class="`${className}__camera-select`"
            >
              <v-btn slot="activator" flat color="white">
                <v-icon large>mdi-camera</v-icon>
              </v-btn>
              <v-list>
                <v-list-tile
                  v-for="camera in cameras"
                  :key="camera.deviceId"
                  @click="currentCamera = camera.deviceId"
                >
                  <v-list-tile-title>{{ camera.label }}</v-list-tile-title>
                </v-list-tile>
              </v-list>
            </v-menu>
          </div>
        </v-flex>
        <v-flex xs12 class="pa-4">
          <h3 class="subheading text-xs-center">
            {{ $t('scan.hold_your_device') }}
          </h3>
        </v-flex>
      </v-layout>

      <!-- No Camera -->
      <v-layout
        v-if="cameraStatus === 'nocamera'"
        row
        wrap
        justify-center
        align-center
        class="text-xs-center pa-5"
      >
        <v-flex xs12>
          <h3 class="headline">{{ $t('scan.no_camera_found') }}</h3>
          <p class="mt-1 mb-0">{{ $t('scan.connect_camera') }}</p>
        </v-flex>
      </v-layout>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          flat
          @click="show = false"
        >
          {{ $t('scan.close_button') }}
        </v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script>
import { Scanner } from '@/lib/zxing'

export default {
  mounted () {
    this.init()
  },
  beforeDestroy () {
    this.destroyScanner()
  },
  computed: {
    className () {
      return 'qrcode-scanner'
    },
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  },
  watch: {
    cameras (cameras) {
      if (cameras.length > 0) {
        this.currentCamera = this.cameras[0].deviceId

        this.cameraStatus = 'active'
      } else {
        this.cameraStatus = 'nocamera'
      }
    },
    currentCamera () {
      this.scanner.start(this.currentCamera)
        .then(content => this.onScan(content))
    }
  },
  data: () => ({
    cameraStatus: 'waiting', // can be: waiting, active, nocamera
    scanner: null,
    currentCamera: null,
    cameras: []
  }),
  methods: {
    init () {
      return this.initScanner()
        .then(() => {
          return this.getCameras()
        })
        .catch(err => {
          this.cameraStatus = 'nocamera'
          this.$store.dispatch('snackbar/show', {
            message: this.$t('scan.something_wrong')
          })
          console.error(err)
        })
    },
    async initScanner () {
      this.scanner = new Scanner({
        videoElement: this.$refs.camera
      })

      return this.scanner.init()
    },
    destroyScanner () {
      // First check if the scanner was initialized.
      // Needed when an unexpected error occurred,
      // or when the dialog closes before initialization.
      return this.scanner && this.scanner.stop()
    },
    async getCameras () {
      this.cameras = await this.scanner.getCameras()
    },
    onScan (content) {
      this.$emit('scan', content)
      this.destroyScanner()
      this.show = false
    }
  },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
}
</script>

<style lang="stylus" scoped>
.qrcode-scanner
  &__camera
    width: 100%
    height: 300px
    background-color: #000
    position: relative

    video
      width: inherit
      height: inherit
      position: absolute
      left: 0
      top: 0

  &__camera-select
    position: absolute
    right: 0
    bottom: 0

    >>> .v-btn
      min-width: auto
      padding: 0 8px
</style>
