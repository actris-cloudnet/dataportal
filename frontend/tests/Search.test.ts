import { mount, Wrapper } from '@vue/test-utils'
import Search from '../src/views/Search.vue'
import axios, { AxiosResponse, AxiosPromise } from 'axios'
import { init, allFiles, allSites } from './lib'
import { mocked } from 'ts-jest/dist/util/testing'
init()

jest.mock('axios')

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: 'OK',
  config: {},
  headers: {}
}

mocked(axios.get).mockImplementation((url, _): AxiosPromise => {
  if (url.includes('files')) {
    return Promise.resolve({ ...axiosResponse, ...{ data: allFiles } })
  } else { // sites
    return Promise.resolve({ ...axiosResponse, ...{ data: allSites } })
  }
})

describe('Search.vue', () => {

  test('Should include text "Filter search"', () => {
    const wrapper = mount(Search)
    return expect(wrapper.text()).toContain('Filter search')
  })

  describe('date selectors', () => {
    let wrapper: Wrapper<Vue>
    beforeAll(() => wrapper = mount(Search))

    it('should have the first day of the current year as the default dateFrom', () => {
      expect((wrapper.find('input[name="dateFrom"]').element as HTMLInputElement).value).toBe('2020-01-01')
    })

    it('should have today as the default dateTo', () => {
      expect((wrapper.find('input[name="dateTo"]').element as HTMLInputElement).value).toBe(new Date().toISOString().substring(0,10))
    })

    it('should display all data objects upon changing dateFrom to earliest data object date', () => {
      const input = wrapper.find('input[name="dateFrom"]')
      const inputElement = (input.element as HTMLInputElement)
      inputElement.value = allFiles.map(file => file.measurementDate).reduce((prev, cur) => new Date(cur) < new Date(prev) ? cur : prev)
      input.trigger('change')
      allFiles.map(file => file.title).forEach(title =>
        expect(wrapper.text()).toContain(title)
      )
    })

  })
})
