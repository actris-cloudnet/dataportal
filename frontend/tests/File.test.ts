/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, Wrapper } from '@vue/test-utils'
import File from '../src/views/File.vue'
import axios, { AxiosResponse, AxiosPromise, AxiosRequestConfig } from 'axios'
import Vue from 'vue'
import {init, allFiles, allSites} from './lib'
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

const visualizationResponse = {"sourceFileId":"62a702ca-318a-478d-8a32-842d4ec94a85","visualizations":[{"filename":"20200503_bucharest_chm15k_beta.png","productVariable":{"id":"lidar-beta","humanReadableName":"Attenuated backscatter coefficient","order":"0"}},{"filename":"20200503_bucharest_chm15k_beta_raw.png","productVariable":{"id":"lidar-beta_raw","humanReadableName":"Raw attenuated backscatter coefficient","order":"1"}}],"productHumanReadable":"Lidar","locationHumanReadable":"Bucharest"}

const augmentAxiosResponse = (data: any) => ({ ...axiosResponse, ...{ data } })

const generateAxiosMock = (returnValue: any) =>
  (_url: string, _: AxiosRequestConfig | undefined): AxiosPromise =>
    Promise.resolve(augmentAxiosResponse(returnValue))

const axiosMockWith = (returnValue: any) =>
  mocked(axios.get).mockImplementation(generateAxiosMock(returnValue))

const defaultAxiosMock = (url: string, _: AxiosRequestConfig | undefined): AxiosPromise => {
  if (url.includes('visualization')) {
    return Promise.resolve(augmentAxiosResponse(visualizationResponse))
  } else {
    return Promise.resolve(augmentAxiosResponse(allFiles[0]))
  }
}

let wrapper: Wrapper<Vue>
describe('File.vue', () => {
  it('displays a note on volatile file', async () => {
    mocked(axios.get).mockImplementation(defaultAxiosMock)
    wrapper = mount(File)
    await Vue.nextTick()
    return expect(wrapper.text()).toContain('This is a volatile file.')
  })
  it('does not display a note on stable file', async () => {
    axiosMockWith(allFiles[1])
    wrapper = mount(File)
    await Vue.nextTick()
    return expect(wrapper.text()).not.toContain('This is a volatile file.')
  })
})
