/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, Wrapper } from '@vue/test-utils'
import File from '../src/views/File.vue'
import axios, { AxiosResponse, AxiosPromise, AxiosRequestConfig } from 'axios'
import Vue from 'vue'
import { init, allFiles } from './lib'
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

const augmentAxiosResponse = (data: any) => ({ ...axiosResponse, ...{ data } })

const generateAxiosMock = (returnValue: any) =>
  (_url: string, _: AxiosRequestConfig | undefined): AxiosPromise =>
    Promise.resolve(augmentAxiosResponse(returnValue))

const axiosMockWith = (returnValue: any) =>
  mocked(axios.get).mockImplementation(generateAxiosMock(returnValue))


let wrapper: Wrapper<Vue>
describe('File.vue', () => {
  it('displays a note on volatile file', async () => {
    axiosMockWith(allFiles[0])
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
