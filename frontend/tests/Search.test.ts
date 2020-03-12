import { mount } from '@vue/test-utils'
import Search from '../src/views/Search.vue'
import init from './lib'
init()


describe('Search.vue', () => {
  test('Should include text "Filter search"', () => {
    const wrapper = mount(Search)
    return expect(wrapper.text()).toContain('Filter search')
  })
})
