// Based on https://vueuse.org/router/useRouteQuery/
//
// MIT License
//
// Copyright (c) 2019-PRESENT Anthony Fu<https://github.com/antfu>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { customRef, getCurrentScope, nextTick, onScopeDispose, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const _cache = new WeakMap();

export interface QueryType<T> {
  parse(input: string): T;
  format(value: T): string | undefined;
}

export function useRouteQuery<T>(options: { name: string; defaultValue: T; type: QueryType<T> }) {
  const {
    name,
    defaultValue,
    type: { parse, format },
  } = options;
  const route = useRoute();
  const router = useRouter();

  if (!_cache.has(route)) {
    _cache.set(route, new Map());
  }

  const _query: Map<string, any> = _cache.get(route);

  if (getCurrentScope()) {
    onScopeDispose(() => {
      _query.delete(name);
    });
  }

  _query.set(name, route.query[name]);

  let _trigger: () => void;

  const proxy = customRef<T>((track, trigger) => {
    _trigger = trigger;

    return {
      get() {
        track();
        const data = _query.get(name);
        return data !== undefined ? parse(data) : defaultValue;
      },
      set(value) {
        const queryValue = format(value);
        if (_query.get(name) === queryValue) return;
        _query.set(name, queryValue);
        trigger();
        nextTick(() => {
          const { params, query, hash } = route;
          router
            .replace({
              params,
              query: { ...query, ...Object.fromEntries(_query.entries()) },
              hash,
            })
            .catch(() => {
              /* skip */
            });
        }).catch(() => {
          /* skip */
        });
      },
    };
  });

  watch(
    () => route.query[name],
    (queryValue) => {
      if (queryValue === _query.get(name)) return;
      _query.set(name, queryValue);
      _trigger();
    },
    { flush: "sync" },
  );

  return proxy;
}

export const queryString: QueryType<string> = {
  parse: (x) => x,
  format: (x) => x,
};

export const queryStringArray: QueryType<string[]> = {
  parse: (x) => x.split(","),
  format: (x) => x.join(",") || undefined,
};

export const queryBoolean: QueryType<boolean> = {
  parse: (x) => x === "true",
  format: (x) => (x ? "true" : undefined),
};
