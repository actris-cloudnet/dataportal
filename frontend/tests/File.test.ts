/* eslint-disable @typescript-eslint/no-explicit-any */
import {shallowMount, Wrapper} from '@vue/test-utils'
import File from '../src/views/File.vue'
import axios, { AxiosResponse, AxiosPromise, AxiosRequestConfig } from 'axios'
import Vue from 'vue'
import {init, nextTick} from './lib'
import { mocked } from 'ts-jest/dist/util/testing'
import {readResources} from '../../shared/lib'
init()

jest.mock('axios')

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: 'OK',
  config: {},
  headers: {}
}

const visualizationResponse = {'sourceFileId':'62a702ca-318a-478d-8a32-842d4ec94a85','visualizations':[{'filename':'20200503_bucharest_chm15k_beta.png','productVariable':{'id':'lidar-beta','humanReadableName':'Attenuated backscatter coefficient','order':'0'}},{'filename':'20200503_bucharest_chm15k_beta_raw.png','productVariable':{'id':'lidar-beta_raw','humanReadableName':'Raw attenuated backscatter coefficient','order':'1'}}],'productHumanReadable':'Lidar','locationHumanReadable':'Bucharest'}

const augmentAxiosResponse = (data: any) => ({ ...axiosResponse, ...{ data } })

const mountVue = () =>
  shallowMount(File, {
    stubs: ['router-link', 'router-view']
  })


let axiosMockWithFileIdx: Function

let resources: any

let wrapper: Wrapper<Vue>
describe('File.vue', () => {
  beforeAll(async () => {
    resources = await readResources()
    axiosMockWithFileIdx = (idx: number | number[]) => {
      let nreq = 0
      return (url: string, _: AxiosRequestConfig | undefined): AxiosPromise => {
        if (url.includes('visualization')) {
          return Promise.resolve(augmentAxiosResponse(visualizationResponse))
        } else if (url.includes('search')) {
          return Promise.resolve(augmentAxiosResponse(resources['allsearch'].slice(4, 7)))
        } else {
          const i = Array.isArray(idx) ? idx[nreq] : idx
          nreq += 1
          return Promise.resolve(augmentAxiosResponse(resources['allfiles'][i]))
        }
      }
    }
  })
  it('displays a note on volatile file', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx(0))
    wrapper = mountVue()
    await Vue.nextTick()
    return expect(wrapper.text()).toContain('This is a volatile file.')
  })
  it('does not display a note on stable file', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx(4))
    wrapper = mountVue()
    await Vue.nextTick()
    return expect(wrapper.text()).not.toContain('This is a volatile file.')
  })

  it('displays link to next and newest version in oldest version', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx(6))
    wrapper = mountVue()
    await nextTick(3)
    expect(wrapper.findAll('#previousVersion').length).toEqual(0)
    expect(wrapper.find('#nextVersion').html()).toContain(`/file/${resources['allfiles'][5]['uuid']}`)
    expect(wrapper.find('#newestVersion').html()).toContain(`/file/${resources['allfiles'][4]['uuid']}`)
  })

  it('displays link to next, previous and newest version in second-to-newest version', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx(5))
    wrapper = mountVue()
    await nextTick(3)
    expect(wrapper.find('#nextVersion').html()).toContain(`/file/${resources['allfiles'][4]['uuid']}`)
    expect(wrapper.find('#previousVersion').html()).toContain(`/file/${resources['allfiles'][6]['uuid']}`)
    expect(wrapper.find('#newestVersion').html()).toContain(`/file/${resources['allfiles'][4]['uuid']}`)
  })

  it('displays link to previous version in the newest version', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx(4))
    wrapper = mountVue()
    await nextTick(3)
    expect(wrapper.findAll('#newestVersion').length).toEqual(0)
    expect(wrapper.find('#previousVersion').html()).toContain(`/file/${resources['allfiles'][5]['uuid']}`)
  })

  it('displays last modified date', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx(0))
    wrapper = mountVue()
    await Vue.nextTick()
    expect(wrapper.text()).toContain(resources['allfiles'][0]['releasedAt'])
  })

  it('displays links to source files', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx([9, 8]))
    wrapper = mountVue()
    await nextTick(3)
    expect(wrapper.findAll('#provenance').length).toEqual(1)
    expect(wrapper.find('#provenance').html()).toContain(`/file/${resources['allfiles'][8]['uuid']}`)
  })

  it('does not display source file info where not applicable', async () => {
    mocked(axios.get).mockImplementation(axiosMockWithFileIdx(8))
    wrapper = mountVue()
    await nextTick(3)
    expect(wrapper.findAll('#provenance').length).toEqual(0)
  })
})
