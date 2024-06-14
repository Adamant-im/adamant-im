<template>
  <v-dialog v-model="show" :class="classes.root" width="500">
    <v-card :class="classes.root">
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
        <v-progress-circular indeterminate color="primary" size="32" class="ml-4" />
      </v-row>

      <!-- Camera Active -->
      <v-row v-show="cameraStatus === 'active'" no-gutters>
        <v-col cols="12">
          <div :class="classes.camera">
            <video ref="videoElement" />
            <v-menu v-if="cameras.length > 1" offset-y :class="classes.cameraSelect">
              <template #activator>
                <v-btn variant="text" color="white">
                  <v-icon size="x-large" icon="mdi-camera" />
                </v-btn>
              </template>
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
        <v-col cols="12" class="pa-6">
          <h3 class="a-text-regular text-center">
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
        <v-btn variant="text" class="a-btn-regular" @click="show = false">
          {{ $t('scan.close_button') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { Result } from '@zxing/library'
import { IScannerControls } from '@zxing/browser'

import { Scanner } from '@/lib/zxing/index'

const className = 'qrcode-scanner-dialog'
const classes = {
  root: className,
  camera: `${className}__camera`,
  cameraSelect: `${className}__camera-select`
}

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['scan', 'update:modelValue'],
  setup(props, { emit }) {
    const store = useStore()
    const { t } = useI18n()

    const videoElement = ref<HTMLVideoElement | null>(null)
    const cameraStatus = ref('waiting') // can be: waiting, active, nocamera
    const scanner = ref<Scanner | null>(null)
    const cameras = ref<MediaDeviceInfo[]>([])
    const currentCamera = ref<string | null>(null)
    const scannerControls = ref<IScannerControls | null>(null)

    // computed
    const show = computed<boolean>({
      get() {
        return props.modelValue
      },
      set(value) {
        emit('update:modelValue', value)
      }
    })

    // methods
    const init = async () => {
      return initScanner()
        .then(() => {
          return getCameras()
        })
        .catch((err) => {
          cameraStatus.value = 'nocamera'
          store.dispatch('snackbar/show', {
            message: t('scan.something_wrong')
          })
          console.error(err)
        })
    }

    const initScanner = async () => {
      scanner.value = new Scanner({
        videoElement: videoElement.value as HTMLVideoElement
      })

      return scanner.value.init()
    }

    const getCameras = async () => {
      cameras.value = await (scanner.value as Scanner).getCameras()
    }

    const destroyScanner = () => {
      // First check if the scanner controls was initialized.
      // Needed when an unexpected error occurred,
      // or when the dialog closes before initialization.
      return scannerControls.value && scannerControls.value.stop()
    }

    const onScan = (content: string) => {
      emit('scan', content)
      destroyScanner()
      show.value = false
    }

    // watchers
    watch(cameras, (cameras: MediaDeviceInfo[]) => {
      if (cameras.length > 0) {
        const cameraKey = cameras.length >= 2 ? 1 : 0
        currentCamera.value = cameras[cameraKey].deviceId

        cameraStatus.value = 'active'
      } else {
        cameraStatus.value = 'nocamera'
      }
    })

    watch(currentCamera, async () => {
      scannerControls.value =
        scanner.value &&
        (await scanner.value.start(currentCamera.value as string, (result: Result) => {
          if (result) {
            onScan(result.getText())
          }
        }))
    })

    // lifecycle components
    onMounted(() => {
      init()
    })

    onBeforeUnmount(() => {
      destroyScanner()
    })

    return {
      cameras,
      cameraStatus,
      classes,
      currentCamera,
      show,
      videoElement
    }
  }
})
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
