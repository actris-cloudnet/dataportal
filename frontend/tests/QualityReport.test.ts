/* eslint-disable @typescript-eslint/no-explicit-any */
import {mount, Wrapper} from '@vue/test-utils'
import axios, {AxiosPromise, AxiosRequestConfig} from 'axios'
import Vue from 'vue'
import {augmentAxiosResponse, init} from './lib'
import {findByUuid, readResources} from '../../shared/lib'
import {mocked} from 'ts-jest/dist/util/testing'
import QualityReportView from '../src/views/QualityReport.vue'
import QualityTestResult from '../src/components/QualityTestResult.vue'

init()

jest.mock('axios')


let resources: any
let wrapper: Wrapper<Vue>

describe('QualityReport.vue', () => {
  beforeAll(async () => {
    resources = await readResources()
    const func = (url: string, _req: AxiosRequestConfig | undefined): AxiosPromise => {
      if (url.includes('quality')) {
        return Promise.resolve(augmentAxiosResponse(resources['quality-report']))
      } else {
        return Promise.resolve(augmentAxiosResponse(findByUuid(resources['allfiles'], 'acf')))
      }
    }
    mocked(axios.get).mockImplementation(func)
    wrapper = mount(QualityReportView, { propsData: { mode: 'data'}, stubs: { 'quality-test-result': QualityTestResult }})
  })

  it('shows file information', async () => {
    await Vue.nextTick()
    expect(wrapper.text()).toContain('Bucharest')
    expect(wrapper.text()).toContain('20 February 2021')
    return expect(wrapper.text()).toContain('Radar')
  })

  it('shows failing tests', async () => {
    await Vue.nextTick()
    expect(wrapper.text()).toContain('references')
    expect(wrapper.text()).toContain('cloudnetpy_version')
    expect(wrapper.text()).toContain('altitude')
    expect(wrapper.text()).toContain('651542365')
    return expect(wrapper.text()).toContain('Conventions')
  })

  it('shows number of total tests', async () => {
    await Vue.nextTick()
    expect(wrapper.text()).toContain('16')
  })



})

