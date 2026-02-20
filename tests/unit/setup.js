import { expect, vi } from 'vitest'
import vueSnapshotSerializer from 'jest-serializer-vue'
import '../__mocks__/globals'

expect.addSnapshotSerializer(vueSnapshotSerializer)

globalThis.jest = vi
