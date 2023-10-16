<<<<<<< HEAD
import { notEmpty } from "@/lib/index";
import type { Product } from "@shared/entity/Product";
import axios from "axios";

export interface ProductInfo {
  id: string;
  legacy: boolean;
  uuid: string;
  errorLevel?: string | null;
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
}

const apiUrl = import.meta.env.VITE_BACKEND_URL;

function createProductLevels(lvlTranslate: LvlTranslate, productInfo?: ProductInfo, existingObj?: ProductLevels) {
  if (!existingObj) {
    existingObj = {
      "1b": [],
      "1c": [],
      "2": [],
    };
  }
  if (productInfo) {
    const { id, legacy, errorLevel, uuid } = productInfo;
    const lvl = lvlTranslate[id];
    if (!lvl) return existingObj;
    existingObj[lvl].push({
      id,
      legacy,
      errorLevel,
      uuid,
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
}

export async function parseDataStatus(siteId: string): Promise<DataStatus> {
  const [searchRes, prodRes] = await Promise.all([
    axios.get<ProductAvailability[]>(`${apiUrl}sites/${siteId}/product-availability/`),
    axios.get<Product[]>(`${apiUrl}products/`),
  ]);
  const searchResponse = searchRes.data;
  const l2ProductCount = prodRes.data.filter((product) => product.level === "2" && !product.experimental).length;
  const allProducts = prodRes.data.filter((prod) => !prod.experimental);
  if (!searchResponse || !allProducts || searchResponse.length == 0) {
    return { allProducts, dates: [], lvlTranslate: {}, availableProducts: [], l2ProductCount: 0 };
  }

  const productMap = allProducts.reduce((map: Record<string, Product>, product) => {
    map[product.id] = product;
    return map;
  }, {});
  const productIds = new Set(searchResponse.map((file) => file.productId));
  const availableProducts = Array.from(productIds)
    .map((productId) => productMap[productId])
    .filter(notEmpty);
  const lvlTranslate = allProducts.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.level as keyof ProductLevels }), {});

  const dates = searchResponse.reduce(
    (obj, cur) => {
      const productInfo = {
        id: cur.productId,
        legacy: cur.legacy,
        uuid: cur.uuid,
        errorLevel: "errorLevel" in cur ? cur.errorLevel : undefined,
      };
      if (!obj[cur.measurementDate]) {
        obj[cur.measurementDate] = { date: cur.measurementDate, products: createProductLevels(lvlTranslate) };
      }
      createProductLevels(lvlTranslate, productInfo, obj[cur.measurementDate].products);
      return obj;
    },
    {} as Record<string, ProductDate>,
  );

  return { allProducts, dates: Object.values(dates), lvlTranslate, availableProducts, l2ProductCount };
}
