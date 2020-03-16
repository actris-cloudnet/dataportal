import { mount, Wrapper } from '@vue/test-utils'
import Search from '../src/views/Search.vue'
import axios, { AxiosResponse, AxiosPromise, AxiosRequestConfig } from 'axios'
import Vue from 'vue'
import { init, allFiles, allSites, dateToISOString } from './lib'
import { mocked } from 'ts-jest/dist/util/testing'
init()

const filesSortedByDate = allFiles
  .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())

jest.mock('axios')

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: 'OK',
  config: {},
  headers: {}
}

const augmentAxiosResponse = (data: any) => ({ ...axiosResponse, ...{ data } })

const defaultAxiosMock = (url: string, _: AxiosRequestConfig | undefined): AxiosPromise => {
  if (url.includes('files')) {
    return Promise.resolve(augmentAxiosResponse(allFiles))
  } else { // sites
    return Promise.resolve(augmentAxiosResponse(allSites))
  }
}

const getMockedAxiosLastCallSecondArgument = () => {
  const calls = mocked(axios.get).mock.calls
  const idxLast = calls.length - 1
  const lastCall = calls[idxLast]
  const secondArg = lastCall[1]
  if (!secondArg) return {}
  return secondArg
}


describe('Search.vue', () => {

  test('Should include text "Filter search"', () => {
    const wrapper = mount(Search)
    return expect(wrapper.text()).toContain('Filter search')
  })

  describe('date selectors', () => {
    let wrapper: Wrapper<Vue>
    beforeAll(() => {
      mocked(axios.get).mockImplementation(defaultAxiosMock)
      wrapper = mount(Search)
    })

    it('should have the first day of the current year as the default dateFrom', () => {
      expect((wrapper.find('input[name="dateFrom"]').element as HTMLInputElement).value).toBe('2020-01-01')
    })

    it('should have today as the default dateTo', () => {
      expect((wrapper.find('input[name="dateTo"]').element as HTMLInputElement).value).toBe(new Date().toISOString().substring(0,10))
    })

    it('should display data objects between dateFrom and dateTo by default', () => {
      allFiles.map(file => file.title).forEach(title =>
        expect(wrapper.text()).toContain(title)
      )
    })

    it('should fetch updated list of files from api on dateFrom change', async () => {
      const input = wrapper.find('input[name="dateFrom"]')
      const inputElement = (input.element as HTMLInputElement)
      inputElement.value = filesSortedByDate[1].measurementDate
      input.trigger('change')
      await Vue.nextTick()
      const secondArg = getMockedAxiosLastCallSecondArgument()
      expect(dateToISOString(secondArg.params.dateFrom)).toEqual(inputElement.value)
    })

    it('should fetch updated list of files from api on dateFrom change', async () => {
      const input = wrapper.find('input[name="dateTo"]')
      const inputElement = (input.element as HTMLInputElement)
      inputElement.value = filesSortedByDate[3].measurementDate
      input.trigger('change')
      await Vue.nextTick()
      const secondArg = getMockedAxiosLastCallSecondArgument()
      expect(dateToISOString(secondArg.params.dateTo)).toEqual(inputElement.value)
    })

    it('should update table based on api response', async () => {
      mocked(axios.get).mockImplementationOnce((_1, _2) => Promise.resolve(augmentAxiosResponse(allFiles.slice(1))))
      const input = wrapper.find('input[name="dateTo"]')
      const inputElement = (input.element as HTMLInputElement)
      inputElement.value = filesSortedByDate[1].measurementDate
      input.trigger('change')
      await Vue.nextTick()
      // Contains the dates of all files except the first
      allFiles
        .slice(1)
        .map(file => file.measurementDate).forEach(date =>
          expect(wrapper.text()).toContain(date)
        )
      expect(wrapper.text()).not.toContain(allFiles[0].measurementDate)
    })
  })
})
