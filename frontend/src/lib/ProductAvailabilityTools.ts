import type { ProductLevels, ProductInfo } from "@/lib/DataStatusParser";

export function isLegacy(prod: ProductInfo): boolean {
  return prod.legacy;
}

export function isError(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "error";
}

export function isWarning(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "warning";
}

export function isInfo(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "info";
}

export function qualityExists(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel !== null;
}

export function topQuality(prod: ProductInfo): boolean {
  return "errorLevel" in prod && prod.errorLevel === "pass";
}

export function noData(products: ProductLevels): boolean {
  return (
    products["2"].length == 0 &&
    products["1c"].length == 0 &&
    products["1b"].length == 0
  );
}
