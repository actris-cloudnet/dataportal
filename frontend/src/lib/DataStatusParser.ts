import { backendUrl, compareValues, notEmpty } from "@/lib/index";
import type { InstrumentInfo } from "@shared/entity/Instrument";
import type { Product } from "@shared/entity/Product";
import axios from "axios";

interface InstrumentPids {
  [key: string]: { pid: string; humanReadableName: string }[];
}

export interface ProductInfo {
  id: string;
  legacy: boolean;
  uuid: string;
  experimental: boolean;
  errorLevel?: string | null;
  instrumentPid?: string | null;
  siteId: string;
}

export interface ProductLevels {
  "1b": ProductInfo[];
  "1c": ProductInfo[];
  "2": ProductInfo[];
}

export interface ProductDate {
  date: string;
  products: ProductLevels;
}

export type LvlTranslate = Record<string, keyof ProductLevels>;

export interface DataStatus {
  allProducts: Product[];
  dates: ProductDate[];
  lvlTranslate: LvlTranslate;
  availableProducts: Product[];
  l2ProductCount: number;
  years: number[];
  allPids: InstrumentPids;
}

function createProductLevels(lvlTranslate: LvlTranslate, productInfo?: ProductInfo, existingObj?: ProductLevels) {
  if (!existingObj) {
    existingObj = {
      "1b": [],
      "1c": [],
      "2": [],
    };
  }
  if (productInfo) {
    const { id, legacy, uuid, experimental, errorLevel, instrumentPid, siteId } = productInfo;
    const lvl = lvlTranslate[id];
    if (!lvl) return existingObj;
    existingObj[lvl].push({
      id,
      legacy,
      uuid,
      experimental,
      errorLevel,
      instrumentPid,
      siteId,
    });
  }
  return existingObj;
}

interface ProductAvailability {
  uuid: string;
  measurementDate: string;
  productId: string;
  errorLevel: string;
  legacy: boolean;
  experimental: boolean;
  instrumentPid: string;
  instrumentInfo: InstrumentInfo;
  siteId: string;
}

interface DataStatusConfig {
  site?: string;
  instrumentPid?: string;
}

export async function parseDataStatus(config: DataStatusConfig): Promise<DataStatus> {
  const [searchRes, prodRes] = await Promise.all([
    axios.get<ProductAvailability[]>(`${backendUrl}product-availability/`, {
      params: { site: config.site, instrumentPid: config.instrumentPid, includeExperimental: true },
    }),
    axios.get<Product[]>(`${backendUrl}products/`),
  ]);
  const searchResponse = searchRes.data;

  const l2ProductCount = prodRes.data.filter((product) => product.level === "2" && !product.experimental).length;
  const allProducts = prodRes.data.filter((prod) => prod.level !== "3");
  if (!searchResponse || !allProducts || searchResponse.length == 0) {
    return {
      allProducts,
      dates: [],
      lvlTranslate: {},
      availableProducts: [],
      l2ProductCount: 0,
      years: [],
      allPids: {},
    };
  }

  const productMap = allProducts.reduce((map: Record<string, Product>, product) => {
    map[product.id] = product;
    return map;
  }, {});
  const productIds = new Set(searchResponse.map((file) => file.productId));
  const availableProducts = Array.from(productIds)
    .map((productId) => productMap[productId])
    .filter(notEmpty)
    .sort((a, b) => compareValues(a.humanReadableName, b.humanReadableName));
  const lvlTranslate = allProducts.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.level as keyof ProductLevels }), {});

  const dates = searchResponse.reduce(
    (obj, cur) => {
      const productInfo = {
        id: cur.productId,
        legacy: cur.legacy,
        uuid: cur.uuid,
        experimental: cur.experimental,
        errorLevel: "errorLevel" in cur ? cur.errorLevel : undefined,
        instrumentPid: "instrumentPid" in cur ? cur.instrumentPid : undefined,
        siteId: cur.siteId,
      };
      if (!obj[cur.measurementDate]) {
        obj[cur.measurementDate] = { date: cur.measurementDate, products: createProductLevels(lvlTranslate) };
      }
      createProductLevels(lvlTranslate, productInfo, obj[cur.measurementDate].products);
      return obj;
    },
    {} as Record<string, ProductDate>,
  );

  const years = new Set(searchResponse.map((row) => parseInt(row.measurementDate.slice(0, 4))));

  const allPids: InstrumentPids = {};
  const pidLookup: { [key: string]: { [pid: string]: boolean } } = {};

  availableProducts.forEach((product) => {
    allPids[product.id] = [];
    pidLookup[product.id] = {};
  });

  searchResponse.forEach((item) => {
    if (item.instrumentPid && pidLookup[item.productId] && !pidLookup[item.productId][item.instrumentPid]) {
      allPids[item.productId].push({
        pid: item.instrumentPid,
        humanReadableName: item.instrumentInfo ? item.instrumentInfo.name : item.instrumentPid,
      });
      pidLookup[item.productId][item.instrumentPid] = true;
    }
  });

  return {
    allProducts,
    dates: Object.values(dates),
    lvlTranslate,
    availableProducts,
    l2ProductCount,
    years: [...years],
    allPids,
  };
}
