import { nextTick as vueNextTick } from "vue";
import axios, { AxiosResponse } from "axios";
import { vi } from "vitest";

export const dateToISOString = (date: Date) =>
  date.toISOString().substring(0, 10);

export const tomorrow = () =>
  new Date(new Date().setDate(new Date().getDate() + 1));

export function dateFromPast(n: number) {
  const date = new Date(new Date().setDate(new Date().getDate() - n));
  return dateToISOString(date);
}

export const nextTick = async (amount: number): Promise<unknown> => {
  if (amount == 0) return Promise.resolve();
  return vueNextTick().then(() => nextTick(amount - 1));
};

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: "OK",
  config: {},
  headers: {},
};

export const augmentAxiosResponse = (data: any) => ({
  ...axiosResponse,
  ...{ data },
});

export const wait = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getMockedAxiosLastCallSecondArgument = () => {
  const calls = vi.mocked(axios.get).mock.calls;
  const idxLast = calls.length - 1;
  const lastCall = calls[idxLast];
  const secondArg = lastCall[1];
  if (!secondArg) return {};
  return secondArg;
};
