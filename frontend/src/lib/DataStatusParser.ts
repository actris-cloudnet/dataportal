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
  instrument: ProductInfo[];
  geophysical: ProductInfo[];
}

export interface ProductDate {
  date: string;
  products: ProductLevels;
}

export type ProductType = keyof ProductLevels;

export type LvlTranslate = Record<string, ProductType>;

export interface DataStatus {
  allProducts: Product[];
  dates: ProductDate[];
  lvlTranslate: LvlTranslate;
  availableProducts: Product[];
  geophysicalProductCount: number;
  years: number[];
  allPids: InstrumentPids;
}

function createProductLevels(lvlTranslate: LvlTranslate, productInfo?: ProductInfo, existingObj?: ProductLevels) {
  if (!existingObj) {
    existingObj = {
      instrument: [],
      geophysical: [],
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

  const geophysicalProductCount = prodRes.data.filter(
    (product) => product.type.includes("geophysical") && !product.experimental,
  ).length;

  const allProducts = prodRes.data.filter((prod) => prod.level !== "3");
  if (!searchResponse || !allProducts || searchResponse.length == 0) {
    return {
      allProducts,
      dates: [],
      lvlTranslate: {},
      availableProducts: [],
      geophysicalProductCount: 0,
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

  const lvlTranslate = allProducts.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.id]: cur.type.includes("instrument") || cur.type.includes("model") ? "instrument" : "geophysical",
    }),
    {},
  );

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
    geophysicalProductCount: geophysicalProductCount,
    years: [...years],
    allPids,
  };
}

export interface UploadDate {
  date: string;
  fileCount: number;
  totalSize: number;
}

export interface UploadStatus {
  dates: UploadDate[];
  years: number[];
  maxCount: number;
  maxSize: number;
}

export async function parseUploadStatus(instrumentPid: string): Promise<UploadStatus> {
  const uploadRes = await axios.get<UploadDate[]>(`${backendUrl}upload-amount/`, {
    params: { instrumentPid: instrumentPid },
  });
  const uploadResponse = uploadRes.data;
  if (!uploadResponse) {
    return {
      dates: [],
      years: [],
      maxCount: 0,
      maxSize: 0,
    };
  }
  const years = new Set(uploadResponse.map((row) => parseInt(row.date.slice(0, 4))));
  const maxCount = Math.max(...uploadResponse.map((row) => row.fileCount));
  const maxSize = Math.max(...uploadResponse.map((row) => row.totalSize));
  return {
    dates: uploadResponse,
    years: [...years],
    maxCount,
    maxSize,
  };
}
