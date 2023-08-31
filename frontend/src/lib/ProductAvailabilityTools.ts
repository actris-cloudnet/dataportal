import type { ProductLevels, ProductInfo } from "@/lib/DataStatusParser";

export const isLegacy = (prod: ProductInfo): boolean => prod.legacy;

export const isError = (prod: ProductInfo): boolean => prod?.errorLevel === "error";

export const isWarning = (prod: ProductInfo): boolean => prod?.errorLevel === "warning";

export const isInfo = (prod: ProductInfo): boolean => prod?.errorLevel === "info";

export const isPass = (prod: ProductInfo): boolean => prod?.errorLevel === "pass";

export const qualityExists = (prod: ProductInfo): boolean => "errorLevel" in prod && prod.errorLevel !== null;

export const noData = (products: ProductLevels): boolean =>
  products["2"].length == 0 && products["1c"].length == 0 && products["1b"].length == 0;
