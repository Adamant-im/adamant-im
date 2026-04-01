import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressIndicator from '@/components/ProgressIndicator'

const progressCircularStub = {
  template: '<div class="v-progress-circular-stub" v-bind="$attrs"></div>'
}

describe('ProgressIndicator.vue', () => {
  it('renders the centered overlay spinner markup', () => {
    const wrapper = mount(ProgressIndicator, {
      global: {
        stubs: {
          VProgressCircular: progressCircularStub
        }
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('hides the spinner while keeping the overlay mounted when showSpinner=false', () => {
    const wrapper = mount(ProgressIndicator, {
      props: {
        showSpinner: false
      },
      global: {
        stubs: {
          VProgressCircular: progressCircularStub
        }
      }
    })

    expect(wrapper.classes()).toContain('progress-indicator')
    expect(wrapper.find('.progress-indicator__spinner').attributes('style')).toContain(
      'display: none'
    )
  })
})
