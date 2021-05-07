/* eslint-disable @typescript-eslint/no-explicit-any */
import {Wrapper} from '@vue/test-utils'
import Collection from '../src/views/Collection.vue'
import axios, {AxiosPromise, AxiosRequestConfig} from 'axios'
import Vue from 'vue'
import {augmentAxiosResponse, init, mountVue, nextTick} from './lib'
import {mocked} from 'ts-jest/dist/util/testing'
import {readResources} from '../../shared/lib'
import DataSearchResult from '../src/components/DataSearchResult.vue'
import HowToCite from '../src/components/HowToCite.vue'
import License from '../src/components/License.vue'

init()

jest.mock('axios')


let mockAxios: Function
let resources: any
let wrapper: Wrapper<Vue>

describe('Collection.vue', () => {
  beforeAll(async () => {
    resources = await readResources()
    mockAxios = () => {
      return (url: string, _req: AxiosRequestConfig | undefined): AxiosPromise => {
        if (url.includes('collection')) {
          return Promise.resolve(augmentAxiosResponse(resources['allcollections'][0]))
        } else if (url.includes('search')) {
          return Promise.resolve(augmentAxiosResponse([resources['allsearch'][0], resources['allsearch'][8]]))
        } else if (url.includes('sites')) {
          return Promise.resolve(augmentAxiosResponse(resources['sites']))
        } else if (url.includes('products')) {
          return Promise.resolve(augmentAxiosResponse(resources['products']))
        } else if (url.includes('models')) {
          return Promise.resolve(augmentAxiosResponse(resources['models']))
        } else {
          return Promise.resolve(augmentAxiosResponse({pid: 'testpid'}))
        }
      }
    }
    mocked(axios.get).mockImplementation(mockAxios())
    mocked(axios.post).mockImplementation(mockAxios())
  })

  describe('general view', () => {
    beforeAll(async () => {
      wrapper = mountVue(Collection, {propsData: {mode: 'general'},
        stubs: {'router-link': true, 'data-search-result': DataSearchResult, 'how-to-cite': HowToCite, 'license': License}
      })
      return nextTick(1)
    })

    it('displays date span', async () => {
      return expect(wrapper.find('#summary').text()).toContain('2014-12-05 - 2019-09-01')
    })

    it('displays size', async () => {
      return expect(wrapper.find('#summary').text()).toContain('15.8 MB')
    })

    it('displays file number', async () => {
      return expect(wrapper.find('#summary').text()).toContain('2')
    })

    it('displays products', async () => {
      expect(wrapper.find('#products').text()).toContain('Radar')
      return expect(wrapper.find('#products').text()).toContain('Model')
    })

    it('displays products', async () => {
      expect(wrapper.find('#products').text()).toContain('Radar')
      return expect(wrapper.find('#products').text()).toContain('Model')
    })

    it('displays PID', async () => {
      await nextTick(2)
      expect(wrapper.text()).toContain('testpid')
    })

    it('displays license', async () => {
      await nextTick(2)
      expect(wrapper.text()).toContain('Cloudnet data is licensed under a Creative Commons Attribution 4.0 international licence.')
    })

    it('displays custom citation info', async () => {
      await nextTick(2)
      expect((wrapper.text().match(/Hyytiälä test citation/g) || [])).toHaveLength(1)
    })
  })

  describe('file view', () => {
    beforeAll(async () => {
      wrapper = mountVue(Collection, {
        propsData: {mode: 'files'},
        stubs: {'router-link': true, 'data-search-result': DataSearchResult, 'how-to-cite': HowToCite}
      })
      return nextTick(1)
    })

    it('displays a list of files', () => {
      expect(wrapper.text()).toContain('Radar file from Hyytiälä')
      expect(wrapper.text()).toContain('Model file from Mace Head')
    })
  })
})
