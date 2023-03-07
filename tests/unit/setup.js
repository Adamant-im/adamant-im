import { expect } from 'vitest'
import vueSnapshotSerializer from 'jest-serializer-vue'

expect.addSnapshotSerializer(vueSnapshotSerializer)