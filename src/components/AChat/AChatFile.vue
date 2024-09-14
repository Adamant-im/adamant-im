<template>
  <div :class="classes.container">
    <div :class="classes.containerWithElement">
      <v-img
        v-if="imageUrl"
        :cover="false"
        :class="classes.img"
        :src="imageUrl"
        alt="Selected Image"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
          </div>
        </template>
      </v-img>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, onMounted } from 'vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { useStore } from 'vuex'
import { FileAsset } from '@/lib/adamant-api/asset'

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
      type: Object as PropType<FileAsset>
    }
  },
  components: {},
  setup(props) {
    const store = useStore()
    const imageUrl = ref('')

    const getFileFromStorage = async () => {
      const myAddress = store.state.address

      const cid = props.img?.id
      const fileName = props.img?.name
      const fileType = props.img?.type
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
