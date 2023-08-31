import { dateToString, notEmpty } from "@/lib/index";
import type { Product } from "@shared/entity/Product";
import axios from "axios";
import type { SearchFileResponse } from "@shared/entity/SearchFileResponse";

export interface ReducedSearchResponse {
  measurementDate: string;
  productId: string;
  legacy: boolean;
  uuid: string;
  errorLevel?: string;
}

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

export interface ProductYear {
  year: string;
  dates: ProductDate[];
}

export type LvlTranslate = Record<string, keyof ProductLevels>;

export interface DataStatus {
  allProducts: Product[];
  years: ProductYear[];
  lvlTranslate: LvlTranslate;
  availableProducts: Product[];
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

export async function parseDataStatus(searchPayload: any): Promise<DataStatus> {
  const [searchRes, prodRes] = await Promise.all([
    axios.get<SearchFileResponse[]>(`${apiUrl}search/`, {
      params: searchPayload,
    }),
    axios.get<Product[]>(`${apiUrl}products/`),
  ]);
  const searchResponse = searchRes.data;
  const allProducts = prodRes.data.filter((prod) => !prod.experimental);
  if (!searchResponse || !allProducts || searchResponse.length == 0) {
    return { allProducts, years: [], lvlTranslate: {}, availableProducts: [] };
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
  const initialDate = new Date(
    `${searchResponse[searchResponse.length - 1].measurementDate.toString().slice(0, 4)}-01-01`,
  );
  const endDate = new Date(searchResponse[0].measurementDate);
  const allDates: string[] = [];
  while (initialDate <= endDate) {
    allDates.push(dateToString(new Date(initialDate)));
    initialDate.setDate(initialDate.getDate() + 1);
  }
  const years = searchResponse.reduce((acc: ProductYear[], cur) => {
    const [year, month, day] = cur.measurementDate.toString().split("-");
    const date = `${month}-${day}`;
    const productInfo = {
      id: cur.productId,
      legacy: cur.legacy,
      uuid: cur.uuid,
      errorLevel: "errorLevel" in cur ? cur.errorLevel : undefined,
    };
    const yearIndex = acc.findIndex((obj) => obj.year == year);
    if (yearIndex == -1) {
      const newObj = {
        year,
        dates: allDates
          .filter((dateStr) => dateStr.slice(0, 4) == year)
          .map((dateStr) => {
            const dateSubstr = dateStr.slice(5);
            return {
              date: dateSubstr,
              products:
                dateSubstr == date ? createProductLevels(lvlTranslate, productInfo) : createProductLevels(lvlTranslate),
            };
          }),
      };
      return acc.concat([newObj]);
    } else {
      const foundObj = acc[yearIndex];
      const dateIndex = foundObj.dates.findIndex((obj) => obj.date == date);
      const existingProducts = acc[yearIndex].dates[dateIndex].products;
      acc[yearIndex].dates[dateIndex].products = createProductLevels(lvlTranslate, productInfo, existingProducts);
      return acc;
    }
  }, []);

  return { allProducts, years, lvlTranslate, availableProducts };
}
