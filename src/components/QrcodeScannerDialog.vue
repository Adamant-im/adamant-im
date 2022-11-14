<template>
  <v-dialog
    v-model="show"
    :class="className"
    width="500"
  >
    <v-card :class="className">
      <!-- Camera Waiting -->
      <v-row
        v-if="cameraStatus === 'waiting'"
        justify="center"
        align="center"
        class="pa-8"
        no-gutters
      >
        <div class="a-text-header">
          {{ $t('scan.waiting_camera') }}
        </div>
        <v-progress-circular
          indeterminate
          color="primary"
          size="32"
          class="ml-4"
        />
      </v-row>

      <!-- Camera Active -->
      <v-row
        v-show="cameraStatus === 'active'"
        no-gutters
      >
        <v-col cols="12">
          <div :class="`${className}__camera`">
            <video ref="camera" />
            <v-menu
              v-if="cameras.length > 1"
              offset-y
              :class="`${className}__camera-select`"
            >
              <v-btn
                slot="activator"
                text
                color="white"
              >
                <v-icon large>
                  mdi-camera
                </v-icon>
              </v-btn>
              <v-list>
                <v-list-item
                  v-for="camera in cameras"
                  :key="camera.deviceId"
                  @click="currentCamera = camera.deviceId"
                >
                  <v-list-item-title>{{ camera.label }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-col>
        <v-col
          cols="12"
          class="pa-6"
        >
          <h3
            class="a-text-regular text-center"
          >
            {{ $t('scan.hold_your_device') }}
          </h3>
        </v-col>
      </v-row>

      <!-- No Camera -->
      <v-row
        v-if="cameraStatus === 'nocamera'"
        justify="center"
        align="center"
        class="text-center pa-8"
        no-gutters
      >
        <v-col cols="12">
          <h3 class="a-text-header">
            {{ $t('scan.no_camera_found') }}
          </h3>
          <p class="a-text-regular mt-1 mb-0">
            {{ $t('scan.connect_camera') }}
          </p>
        </v-col>
      </v-row>

      <v-divider class="a-divider" />

      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          class="a-btn-regular"
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
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['scan'],
  data: () => ({
    cameraStatus: 'waiting', // can be: waiting, active, nocamera
    scanner: null,
    currentCamera: null,
    cameras: []
  }),
  computed: {
    className: () => 'qrcode-scanner-dialog',
    show: {
      get () {
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  watch: {
    cameras (cameras) {
      if (cameras.length > 0) {
        const cameraKey = cameras.length === 2 ? 1 : 0
        this.currentCamera = this.cameras[cameraKey].deviceId

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
  mounted () {
    this.init()
  },
  beforeUnmount () {
    this.destroyScanner()
  },
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
  }
}
</script>

<style lang="scss" scoped>
.qrcode-scanner-dialog {
  &__camera {
    width: 100%;
    height: 300px;
    background-color: #000;
    position: relative;

    video {
      width: inherit;
      height: inherit;
      position: absolute;
      left: 0;
      top: 0;
    }
  }

  &__camera-select {
    position: absolute;
    right: 0;
    bottom: 0;
    :deep(.v-btn) {
      min-width: auto;
      padding: 0 8px;
    }
  }
}
</style>
