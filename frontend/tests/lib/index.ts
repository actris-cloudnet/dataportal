// Prevents window.matchMedia error, see https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
import Vue from 'vue'

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
