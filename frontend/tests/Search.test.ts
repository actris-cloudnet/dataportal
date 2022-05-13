/* eslint-disable @typescript-eslint/no-explicit-any */
import {mount, Wrapper} from '@vue/test-utils'
import Search from '../src/views/Search.vue'
import axios, {AxiosPromise, AxiosRequestConfig} from 'axios'
import Vue from 'vue'
import {
  augmentAxiosResponse,
  dateFromPast,
  dateToISOString,
  getMockedAxiosLastCallSecondArgument,
  init, nextTick,
  tomorrow
} from './lib'
import {mocked} from 'ts-jest/dist/util/testing'
import {readResources} from '../../shared/lib'
import VueRouter from 'vue-router'

init()

jest.mock('axios')

const date = new Date()
const dateFromDefault = date.toISOString().substring(0,10)
const dateToDefault = new Date().toISOString().substring(0,10)
let filesSortedByDate: any

Vue.use(VueRouter)
const router = new VueRouter()

describe('Search.vue', () => {
  let wrapper: Wrapper<Vue>
  let resources: any

  const findInputByName = (inputName: string) => wrapper.find(`input[name="${inputName}"]`)
  const findElementById = (id: string) => wrapper.find(`#${id}`)
  const getInputValueByName = (inputName: string) =>
    (wrapper.find(`input[name="${inputName}"]`).element as HTMLInputElement).value

  const changeInputAndNextTick = async (inputName: string, newValue: string) => {
    const input = findInputByName(inputName)
    const inputElement = (input.element as HTMLInputElement)
    inputElement.value = newValue
    input.trigger('change')
    await Vue.nextTick()
  }

  beforeAll(async () => {
    resources = await readResources()
    filesSortedByDate = resources['allfiles']
      .sort((a: any, b: any) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())
    const defaultAxiosMock = (url: string, _: AxiosRequestConfig | undefined): AxiosPromise => {
      if (url.includes('files')) {
        return Promise.resolve(augmentAxiosResponse(resources['allfiles']))
      } else if (url.includes('sites')) { // sites
        return Promise.resolve(augmentAxiosResponse(resources['sites']))
      } else if (url.includes('search')) { // search
        return Promise.resolve(augmentAxiosResponse(resources['allsearch']))
      } else {
        return Promise.resolve(augmentAxiosResponse(resources['products-with-variables']))
      }
    }
    mocked(axios.get).mockImplementation(defaultAxiosMock)
    wrapper = mount(Search, {
      propsData: {
        mode: 'data'
      },
      stubs: {
        Map: true
      },
      router
    })
  })

  it('makes less than 7 api request on mount', () => {
    // files and sites
    expect(mocked(axios.get).mock.calls.length).toBeLessThan(7)
  })

  describe('date selectors', () => {

    it('has the correct default dateFrom', () => {
      expect(getInputValueByName('dateFrom')).toBe(dateFromDefault)
    })

    it('has today as the default dateTo', () => {
      expect(getInputValueByName('dateTo')).toBe(dateToDefault)
    })

    it('sets correct date ranges from quickselector buttons', async () => {
      await findElementById('weekBtn').trigger('click')
      expect(getInputValueByName('dateFrom')).toBe(dateFromPast(0))
      expect(getInputValueByName('dateTo')).toBe(dateToDefault)
      await findElementById('yearBtn').trigger('click')
      const year = new Date().getFullYear()
      expect(getInputValueByName('dateFrom')).toBe(`${year}-01-01`)
      expect(getInputValueByName('dateTo')).toBe(dateToDefault)
      await findElementById('monthBtn').trigger('click')
      expect(getInputValueByName('dateFrom')).toBe(dateFromPast(29))
      expect(getInputValueByName('dateTo')).toBe(dateToDefault)
    })

    it('displays data objects between dateFrom and dateTo by default', () => {
      // Has to be sliced because only 10 results are shown before pagination
      resources['allsearch'].slice(0, 10).map((file: any) => file.measurementDate).forEach((date: any) =>
        expect(wrapper.text()).toContain(date)
      )
    })

    it('fetches updated list of files from api on dateFrom change', async () => {
      const newValue = filesSortedByDate[1].measurementDate
      await changeInputAndNextTick('dateFrom', newValue)
      const secondArg = getMockedAxiosLastCallSecondArgument()
      return expect(dateToISOString(secondArg.params.dateFrom)).toEqual(newValue)
    })

    it('Inserts correct parameters to url query string', async () => {
      const dateFrom = '2019-01-01'
      const dateTo = '2020-01-01'
      await changeInputAndNextTick('dateFrom', dateFrom)
      await changeInputAndNextTick('dateTo', dateTo)
      const url = document.URL
      const query = url.substring(url.indexOf('?') + 1)
      return expect(query).toMatch(`dateFrom=${dateFrom}&dateTo=${dateTo}`)
    })

    it('fetches updated list of files from api on dateTo change', async () => {
      const newValue = filesSortedByDate[3].measurementDate
      await changeInputAndNextTick('dateTo', newValue)
      const secondArg = getMockedAxiosLastCallSecondArgument()
      return expect(dateToISOString(secondArg.params.dateTo)).toEqual(newValue)
    })

    it('updates table based on api response', async () => {
      mocked(axios.get).mockImplementationOnce((_1, _2) => Promise.resolve(augmentAxiosResponse(resources['allsearch'].slice(3))))
      const newValue = filesSortedByDate[0].measurementDate
      await changeInputAndNextTick('dateFrom', newValue)
      // Contains the dates of all files except the first
      resources['allsearch']
        .slice(3)
        .map((file: any) => file.measurementDate).forEach((date: any) =>
          expect(wrapper.text()).toContain(date))
      expect(wrapper.text()).not.toContain(resources['allsearch'][0].measurementDate)
      expect(wrapper.text()).not.toContain(resources['allsearch'][1].measurementDate)
      return expect(wrapper.text()).not.toContain(resources['allsearch'][2].measurementDate)
    })

    it('does not touch API on invalid input', async () => {
      const numberOfCallsBefore = mocked(axios.get).mock.calls.length
      const newValue = 'asdf'
      await changeInputAndNextTick('dateTo', newValue)
      await changeInputAndNextTick('dateFrom', newValue)
      const numberOfCallsAfter = mocked(axios.get).mock.calls.length
      return expect(numberOfCallsBefore).toEqual(numberOfCallsAfter)
    })

    it('displays error when inserting invalid input', async () => {
      const newValue = 'asdf'
      await changeInputAndNextTick('dateTo', newValue)
      await changeInputAndNextTick('dateFrom', newValue)
      expect(wrapper.text()).toContain('Invalid input')
      expect(findElementById('dateTo').classes()).toContain('error')
      return expect(findElementById('dateFrom').classes()).toContain('error')
    })

    it('resets error when replacing invalid input with valid', async () => {
      const newValue = 'asdf'
      await changeInputAndNextTick('dateTo', newValue)
      await changeInputAndNextTick('dateFrom', newValue)
      await changeInputAndNextTick('dateFrom', '2018-09-01')
      await changeInputAndNextTick('dateTo', '2018-09-02')
      expect(wrapper.text()).not.toContain('Invalid input')
      expect(findElementById('dateTo').classes()).not.toContain('error')
      return expect(findElementById('dateFrom').classes()).not.toContain('error')
    })

    it('displays error if date is in the future', async () => {
      await changeInputAndNextTick('dateFrom', dateToISOString(tomorrow()))
      await changeInputAndNextTick('dateTo', dateToISOString(tomorrow()))
      expect(wrapper.text()).toContain('Provided date is in the future.')
      expect(findElementById('dateFrom').classes()).toContain('error')
      return expect(findElementById('dateTo').classes()).toContain('error')
    })

    it('displays error if dateFrom is later than dateTo', async () => {
      await changeInputAndNextTick('dateFrom', '2018-09-02')
      await changeInputAndNextTick('dateTo', '2018-09-01')
      expect(wrapper.text()).toContain('Date from must be before date to.')
      expect(findElementById('dateFrom').classes()).toContain('error')
      return expect(findElementById('dateTo').classes()).toContain('error')
    })
  })

  describe('volatility', () => {

    it('displays volatile label only next to volatile items', async () => {
      return expect(findElementById('tableContent').findAll('.volatile')).toHaveLength(4)
    })
  })

  describe('legacy', () => {

    it('makes correct query to backend', async () => {
      const calls = mocked(axios.get).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[1]).toMatchObject({params: {showLegacy: true}})
    })

    it('displays legacy label next to volatile items', async () => {
      return expect(findElementById('tableContent').findAll('.legacy')).toHaveLength(1)
    })
  })

  describe('experimental products', () => {

    it('fetches experimental products when clicking show exp prods checkbox', async () => {
      let calls = mocked(axios.get).mock.calls
      let lastCall = calls[calls.length - 1][1] as any
      expect(lastCall.params.product).not.toContain('l3-cf')
      await findElementById('showExpProductsCheckbox').trigger('click')
      await nextTick(1)
      calls = mocked(axios.get).mock.calls
      lastCall = calls[calls.length - 1][1] as any
      expect(lastCall.params.product).toContain('l3-cf')
    })
  })

})
