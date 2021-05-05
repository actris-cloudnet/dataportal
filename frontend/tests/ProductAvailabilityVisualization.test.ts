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
  legend: true
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
    const classes = wrapper.find('#dataviz-color-palaiseau-2021-05-05').classes()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('all-data')
  })

  it('displays yellow color for days that have incomplete data', async () => {
    const classes = wrapper.find('#dataviz-color-palaiseau-2021-05-04').classes()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('missing-data')
  })

  it('displays dark gray color for days that have only legacy data', async () => {
    const classes = wrapper.find('#dataviz-color-palaiseau-2021-05-03').classes()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('only-legacy-data')
  })

  it('displays light gray color for days that have only model data', async () => {
    const classes = wrapper.find('#dataviz-color-palaiseau-2021-05-02').classes()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('only-model-data')
  })

  it('displays white color for days that have no data', async () => {
    const classes = wrapper.find('#dataviz-color-palaiseau-2021-05-01').classes()
    expect(classes.length).toEqual(2)
    expect(classes).toContain('no-data')
  })
})
