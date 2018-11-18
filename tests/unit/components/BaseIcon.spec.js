import { mount } from '@vue/test-utils'

import BaseIcon from '@/components/icons/BaseIcon'

describe('BaseIcon.vue', () => {
  it('render without props', () => {
    const wrapper = mount(BaseIcon)

    // check this pattern <svg><g></g></svg>
    expect(wrapper.html())
      .toEqual(expect.stringMatching(/<svg[^<>]*>.*<g[^<>]*><\/g>.*<\/svg>/gm))

    // check default color
    expect(wrapper.html()).toContain('<g fill="currentColor"></g>')
  })

  it('render with props', () => {
    const propsData = {
      width: '64',
      height: '64',
      color: '#FF0000',
      title: 'Icon title',
      viewBox: '0 0 128 128'
    }

    const wrapper = mount(BaseIcon, {
      propsData
    })

    const svgElement = wrapper.element
    const gElement = svgElement.children[1]

    expect(svgElement.getAttribute('width')).toBe(propsData.width) // width
    expect(svgElement.getAttribute('height')).toBe(propsData.height) // height
    expect(svgElement.getAttribute('viewBox')).toBe(propsData.viewBox) // viewBox
    expect(gElement.getAttribute('fill')).toBe(propsData.color) // color
    expect(wrapper.html()).toContain(`<title>${propsData.title}</title>`) // title
  })

  it('render with child icon component', () => {
    const childIconComponent = '<svg>child icon</svg>'

    const wrapper = mount(BaseIcon, {
      slots: {
        default: childIconComponent
      }
    })

    expect(wrapper.html()).toContain(childIconComponent)
  })

  it('render with custom SVG markup', () => {
    const slotContent = '<rect x="0" y="0" width="512" height="512"></rect>'

    const wrapper = mount(BaseIcon, {
      slots: {
        default: slotContent
      }
    })

    expect(wrapper.html()).toContain(slotContent)
  })
})
