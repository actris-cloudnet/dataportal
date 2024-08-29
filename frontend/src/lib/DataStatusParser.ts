import { backendUrl, compareValues } from "@/lib/index";
import type { Product } from "@shared/entity/Product";
import axios from "axios";

export interface ProductInfo {
  id: string;
  legacy: boolean;
  uuid: string;
  experimental: boolean;
  siteId: string;
  errorLevel: string | null;
  instrumentPid: string | null;
  modelId: string | null;
}

export interface ProductLevels {
  instrument: ProductInfo[];
  geophysical: ProductInfo[];
}

export type ProductType = keyof ProductLevels;

type LvlTranslate = Record<string, ProductType>;

interface InstrumentPids {
  [key: string]: { pid: string; humanReadableName: string }[];
}

interface ModelInfo {
  id: string;
  humanReadableName: string;
}

export interface ProductDate {
  date: string;
  products: ProductLevels;
}

export interface DataStatus {
  allProducts: Product[];
  dates: ProductDate[];
  lvlTranslate: LvlTranslate;
  availableProducts: Product[];
  geophysicalProductCount: number;
  years: number[];
  allPids: InstrumentPids;
  allModels: ModelInfo[];
}

interface InstrumentInfo {
  pid: string;
  name: string;
}

interface ProductAvailability {
  uuid: string;
  measurementDate: string;
  productId: string;
  legacy: boolean;
  experimental: boolean;
  siteId: string;
  errorLevel: string | null;
  instrumentInfo: InstrumentInfo | null;
  modelInfo: ModelInfo | null;
}

interface DataStatusConfig {
  site?: string;
  instrumentPid?: string;
  modelId?: string;
}

function createProductLevels(
  lvlTranslate: LvlTranslate,
  productInfo?: ProductInfo,
  existingObj: ProductLevels = { instrument: [], geophysical: [] },
): ProductLevels {
  if (productInfo) {
    const lvl = lvlTranslate[productInfo.id];
    if (lvl) existingObj[lvl].push(productInfo);
  }
  return existingObj;
}

export async function parseDataStatus(config: DataStatusConfig): Promise<DataStatus> {
  const [searchRes, prodRes] = await Promise.all([
    axios.get<ProductAvailability[]>(`${backendUrl}product-availability/`, {
      params: {
        site: config.site,
        instrumentPid: config.instrumentPid,
        model: config.modelId,
        includeExperimental: true,
      },
    }),
    axios.get<Product[]>(`${backendUrl}products/`),
  ]);

  const searchResponse = searchRes.data;
  const prodResponse = prodRes.data;

  const lvlTranslate: LvlTranslate = {};
  let geophysicalProductCount = 0;
  const allProducts = prodResponse.filter((prod) => {
    if (prod.level !== "3") {
      const productType =
        prod.type.includes("instrument") || prod.type.includes("model") ? "instrument" : "geophysical";
      lvlTranslate[prod.id] = productType;
      if (productType === "geophysical" && !prod.experimental) geophysicalProductCount++;
      return true;
    }
    return false;
  });

  if (!searchResponse.length || !allProducts.length) {
    return {
      allProducts,
      dates: [],
      lvlTranslate,
      availableProducts: [],
      geophysicalProductCount,
      years: [],
      allPids: {},
      allModels: [],
    };
  }

  const availableProducts = allProducts
    .filter((product) => searchResponse.some((file) => file.productId === product.id))
    .sort((a, b) => compareValues(a.humanReadableName, b.humanReadableName));

  const dates: Record<string, ProductDate> = {};

  searchResponse.forEach((cur) => {
    const productInfo: ProductInfo = {
      id: cur.productId,
      legacy: cur.legacy,
      uuid: cur.uuid,
      siteId: cur.siteId,
      experimental: cur.experimental,
      errorLevel: cur.errorLevel,
      instrumentPid: cur.instrumentInfo?.pid || null,
      modelId: cur.modelInfo?.id || null,
    };

    if (!dates[cur.measurementDate]) {
      dates[cur.measurementDate] = { date: cur.measurementDate, products: { instrument: [], geophysical: [] } };
    }
    createProductLevels(lvlTranslate, productInfo, dates[cur.measurementDate].products);
  });

  const years = Array.from(new Set(searchResponse.map((row) => parseInt(row.measurementDate.slice(0, 4)))));

  const allPids: InstrumentPids = {};

  const models: ModelInfo[] = [];

  const modelIds = new Set<string>();

  searchResponse.forEach((item) => {
    const instrumentInfo = item.instrumentInfo;
    if (instrumentInfo?.pid) {
      const productId = item.productId;
      if (!allPids[productId]) {
        allPids[productId] = [];
      }
      const existingPids = new Set(allPids[productId].map((pidInfo) => pidInfo.pid));
      if (!existingPids.has(instrumentInfo.pid)) {
        allPids[productId].push({
          pid: instrumentInfo.pid,
          humanReadableName: instrumentInfo.name,
        });
      }
    }
    const modelInfo = item.modelInfo;
    if (modelInfo?.id && !modelIds.has(modelInfo.id)) {
      models.push(modelInfo);
      modelIds.add(modelInfo.id);
    }
  });

  const allModels = models.sort((a, b) => compareValues(a.humanReadableName, b.humanReadableName));

  return {
    allProducts,
    dates: Object.values(dates),
    lvlTranslate,
    availableProducts,
    geophysicalProductCount,
    years,
    allPids,
    allModels,
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
    params: { instrumentPid },
  });
  const uploadResponse = uploadRes.data;

  if (!uploadResponse.length) {
    return {
      dates: [],
      years: [],
      maxCount: 0,
      maxSize: 0,
    };
  }

  const years = Array.from(new Set(uploadResponse.map((row) => parseInt(row.date.slice(0, 4)))));
  const maxCount = Math.max(...uploadResponse.map((row) => row.fileCount));
  const maxSize = Math.max(...uploadResponse.map((row) => row.totalSize));

  return {
    dates: uploadResponse,
    years,
    maxCount,
    maxSize,
  };
}
