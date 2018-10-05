import { createLocalVue, mount } from '@vue/test-utils'
import VueMaterial from 'vue-material'
import QRFileScan from '@/components/QRFileScan.vue'

const localVue = createLocalVue()
localVue.use(VueMaterial)
localVue.material.registerTheme({
  grey: {}
})
const $t = () => {}

describe('QRFileScan.vue', () => {
  const wrapper = mount(QRFileScan, {
    localVue,
    mocks: {
      $t
    }
  })

  it('Renders modal structure correctly', () => {
    expect(wrapper.contains('div.modal-wrapper')).toBe(true)
    expect(wrapper.contains('div.modal-body')).toBe(true)
    expect(wrapper.contains('div.modal-footer')).toBe(true)
  })
  it('Renders picture-input', () => {
    expect(wrapper.contains({ name: 'picture-input' })).toBe(true)
  })
  it('Renders close button', () => {
    expect(wrapper.find('div.modal-footer').contains({ name: 'md-button' })).toBe(true)
  })
  it('Emits "hide-modal" on close button click', () => {
    wrapper.find('div.modal-footer').find({ name: 'md-button' }).trigger('click')
    expect(wrapper.emitted()['hide-modal']).toBeTruthy()
  })
})
