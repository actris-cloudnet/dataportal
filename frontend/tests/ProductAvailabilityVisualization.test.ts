/* eslint-disable @typescript-eslint/no-explicit-any */
import {Wrapper} from '@vue/test-utils'
import axios, {AxiosPromise, AxiosRequestConfig} from 'axios'
import Vue from 'vue'
import {augmentAxiosResponse, getMockedAxiosLastCallSecondArgument, init, mountVue, nextTick} from './lib'
import {mocked} from 'ts-jest/dist/util/testing'
import {readResources} from '../../shared/lib'
import ProductAvailabilityVisualization from '../src/components/ProductAvailabilityVisualization.vue'

init()

jest.mock('axios')

let resources: any
let wrapper: Wrapper<Vue>
const props = {
  site: 'palaiseau',
  legend: true,
  tooltips: true
}

const getLiWrappers = (element: Wrapper<Vue>) =>
  element.findAll('.dataviz-tooltip li').wrappers

const getColorElementByDate = (wrapper: Wrapper<Vue>, date: string) => {
  const element = wrapper.find(`#dataviz-color-palaiseau-${date}`)
  return {element, classes: element.classes()}
}

describe('ProductAvailabilityVisualization.vue', () => {
  beforeAll(async () => {
    resources = await readResources()
    const axiosMock = (url: string, _: AxiosRequestConfig | undefined): AxiosPromise => {
      if (url.includes('search')) {
        return Promise.resolve(augmentAxiosResponse(resources['productavailabilitysearch']))
      } else {
        return Promise.resolve(augmentAxiosResponse(resources['products']))
      }
    }
    mocked(axios.get).mockImplementation(axiosMock)
    wrapper = mountVue(ProductAvailabilityVisualization, { propsData: props })
    await nextTick(1)
  })

  it('displays green color for days that have all data', async () => {
    const {element, classes} = getColorElementByDate(wrapper, '2021-05-05')
    expect(getLiWrappers(element)
      .every(wrap => wrap.classes().includes('found'))).toBeTruthy()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('all-data')
  })

  it('displays yellow color for days that have incomplete data', async () => {
    const {element, classes} = getColorElementByDate(wrapper, '2021-05-04')
    expect(getLiWrappers(element)
      .every(wrap => {
        const wrapClasses = wrap.classes()
        return wrap.text().includes('Classification')
          ? !wrapClasses.includes('found')
          : wrapClasses.includes('found')
      })).toBeTruthy()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('missing-data')
  })

  it('displays dark gray color for days that have only legacy data', async () => {
    const {element, classes} = getColorElementByDate(wrapper, '2021-05-03')
    const supWrappers = element.findAll('.dataviz-tooltip li sup').wrappers
    expect(getLiWrappers(element)
      .every(wrap => {
        const wrapClasses = wrap.classes()
        return wrap.text().includes('Classification')
          ? wrapClasses.includes('found')
          : !wrapClasses.includes('found')
      })).toBeTruthy()
    expect(supWrappers.length).toEqual(1)
    expect(classes.length).toEqual(2)
    expect(classes).toContain('only-legacy-data')
  })

  it('displays light gray color for days that have only model data', async () => {
    const {element, classes} = getColorElementByDate(wrapper, '2021-05-02')
    expect(getLiWrappers(element)
      .every(wrap => {
        const wrapClasses = wrap.classes()
        return wrap.text().includes('Model')
          ? wrapClasses.includes('found')
          : !wrapClasses.includes('found')
      }))
    expect(classes.length).toEqual(2)
    expect(classes).toContain('only-model-data')
  })

  it('displays white color for days that have no data', async () => {
    const {element, classes} = getColorElementByDate(wrapper, '2021-05-01')
    expect(getLiWrappers(element)
      .every(wrap => !wrap.classes().includes('found'))).toBeTruthy()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('no-data')
  })

  it('displays red color for dates with weird data', async () => {
    const {classes} = getColorElementByDate(wrapper, '2021-04-01')
    expect(classes.length).toEqual(2)
    expect(classes).toContain('error-data')
  })

  it('hides tooltips on tooltips=false', async () => {
    const customWrapper = mountVue(ProductAvailabilityVisualization, { propsData: {...props, tooltips: false } })
    await nextTick(1)
    const {element,} = getColorElementByDate(customWrapper, '2021-05-05')
    expect(getLiWrappers(element).length).toEqual(0)
  })

  it('shows legend on legend=true', async () => {
    expect(wrapper.findAll('.dav-legend').wrappers).toHaveLength(1)
  })

  it('hides legend on legend=false', async () => {
    const customWrapper = mountVue(ProductAvailabilityVisualization, { propsData: {...props, legend: false } })
    await nextTick(1)
    expect(customWrapper.findAll('.dav-legend').wrappers).toHaveLength(0)
  })
})
