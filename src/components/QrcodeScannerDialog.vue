<template>
  <v-dialog
    v-model="show"
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
          <video ref="camera" class="camera"></video>
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
// @todo [Deprecation] URL.createObjectURL with media streams is deprecated and will be removed in M71, around December 2018. Please use HTMLMediaElement.srcObject instead. See https://www.chromestatus.com/features/5618491470118912 for more details.
export default {
  mounted () {
    this.init()
  },
  beforeDestroy () {
    this.destroyScanner()
  },
  computed: {
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
        this.currentCamera = this.cameras[0]
        this.scanner.start(this.currentCamera)

        this.cameraStatus = 'active'
      } else {
        this.cameraStatus = 'nocamera'
      }
    }
  },
  data: () => ({
    cameraStatus: 'waiting', // can be: waiting, active, nocamera
    Instascan: null, // ref
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
      const instascanModule = import(/* webpackMode: "lazy" */ 'instascan')

      // save reference
      this.Instascan = await instascanModule

      this.scanner = new this.Instascan.Scanner({
        video: this.$refs.camera,
        scanPeriod: 1,
        mirror: false
      })

      // attach scan event
      this.scanner.addListener('scan', (content) => {
        this.onScan(content)
      })
    },
    destroyScanner () {
      // First check if the scanner was initialized.
      // Needed when an unexpected error occurred,
      // or when the dialog closes before initialization.
      return this.scanner && this.scanner.stop()
    },
    async getCameras () {
      this.cameras = await this.Instascan.Camera.getCameras()
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

<style scoped>
.camera {
  width: 100%;
  height: 300px;
  background-color: #000;
}
</style>
