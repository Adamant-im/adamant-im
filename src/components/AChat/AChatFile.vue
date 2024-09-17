<template>
  <div :class="classes.container">
    <AChatFileLoader :partner-id="partnerId" :file="img" :transaction="transaction">
      <template #default="{ isLoading, fileUrl, width, height }">
        <v-img :src="fileUrl" :width="400" :aspect-ratio="width / height">
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular color="grey-lighten-4" indeterminate />
            </div>
          </template>
        </v-img>
      </template>
    </AChatFileLoader>
  </div>
</template>

<script lang="ts">
import { AChatFileLoader } from './AChatFileLoader.tsx'
import { defineComponent, ref, PropType, onMounted } from 'vue'
import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { useStore } from 'vuex'
import { FileAsset } from '@/lib/adamant-api/asset'

function imgToDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const dataURL = event.target?.result as string
      resolve(dataURL)
    }

    reader.readAsDataURL(file)
  })
}

function isLocalFile(file: FileAsset | LocalFile): file is LocalFile {
  return 'file' in file && file.file instanceof File
}

const className = 'a-chat-file'
const classes = {
  root: className,
  container: `${className}__container`,
  containerWithElement: `${className}__container-with-element`,
  img: `${className}__img`
}

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    img: {
      type: Object as PropType<FileAsset | LocalFile>,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    }
  },
  components: { AChatFileLoader },
  setup(props) {
    const store = useStore()
    const imageUrl = ref('')

    const getFileFromStorage = async () => {
      if (isLocalFile(props.img)) {
        imageUrl.value = await imgToDataURL(props.img.file.file)
        return
      }

      const myAddress = store.state.address

      const cid = props.img?.id
      const fileName = props.img?.name
      const fileType = props.img?.extension
      const nonce = props.img?.nonce

      const publicKey =
        props.transaction.senderId === myAddress
          ? props.transaction.recipientPublicKey
          : props.transaction.senderPublicKey
      imageUrl.value = await store.dispatch('attachment/getAttachmentUrl', {
        cid,
        publicKey,
        nonce
      })
      if (!!fileName && !!fileType) {
        // TODO: resolve MIME-type
        // downloadFile(data, fileName, '')
      }
    }

    onMounted(() => {
      getFileFromStorage()
    })

    return {
      classes,
      getFileFromStorage,
      imageUrl
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/settings/_colors.scss';
@import '@/assets/styles/themes/adamant/_mixins.scss';

.a-chat-file {
  border-left: 3px solid map-get($adm-colors, 'attention');
  border-radius: 8px;
  margin: 8px;

  &__container {
    max-width: 230px;
  }

  &__container-with-element {
    display: grid;
    gap: 2px;
    grid-template-columns: repeat(2, minmax(50px, 1fr));
    grid-template-rows: auto;
    max-height: 400px;
  }

  &__img {
    width: 100%;
    height: 100%;

    :deep(.v-img__img) {
      object-fit: fill;
    }
  }

  @if length(img) % 2 != 0 {
    &__img:nth-last-child(1):nth-child(odd) {
      grid-column: span 2;
    }
  }
}

.v-theme--light {
  .a-chat-file {
    background-color: map-get($adm-colors, 'secondary');
    color: map-get($adm-colors, 'regular');
  }
}

.v-theme--dark {
  .a-chat-file {
    background-color: rgba(245, 245, 245, 0.1); // @todo const
    color: #fff;
  }
}
</style>
