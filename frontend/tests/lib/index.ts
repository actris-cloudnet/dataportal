/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue'
import axios, {AxiosResponse} from 'axios'
import {shallowMount, ShallowMountOptions, VueClass} from '@vue/test-utils'
import {mocked} from 'ts-jest/dist/util/testing'

// Prevents window.matchMedia error, see https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
export function init() {
  return Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

export const dateToISOString = (date: Date) => date.toISOString().substring(0,10)

export const tomorrow = () => new Date(new Date().setDate(new Date().getDate() + 1))

export function dateFromPast(n: number) {
  const date = new Date(new Date().setDate(new Date().getDate() - n))
  return dateToISOString(date)
}

export const nextTick = async (amount: number): Promise<unknown> => {
  if (amount == 0) return Promise.resolve()
  return Vue.nextTick()
    .then(() => nextTick(amount - 1))
}

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: 'OK',
  config: {},
  headers: {}
}

export const augmentAxiosResponse = (data: any) => ({...axiosResponse, ...{data}})

export const wait = async (ms: number) => new Promise((resolve, _) => setTimeout(resolve, ms))

export const mountVue = (classObject: VueClass<Vue>, options: ShallowMountOptions<Vue> = {}) =>
  shallowMount(classObject, {...{
    stubs: ['router-link', 'router-view']
  }, ...options})

export const getMockedAxiosLastCallSecondArgument = () => {
  const calls = mocked(axios.get).mock.calls
  const idxLast = calls.length - 1
  const lastCall = calls[idxLast]
  const secondArg = lastCall[1]
  if (!secondArg) return {}
  return secondArg
}
