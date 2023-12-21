import type { ProductLevels, ProductInfo } from "@/lib/DataStatusParser";

export const isLegacy = (prod: ProductInfo): boolean => prod.legacy;

export const isExperimental = (prod: ProductInfo): boolean => prod.experimental;

export const isError = (prod: ProductInfo): boolean => prod?.errorLevel === "error";

export const isWarning = (prod: ProductInfo): boolean => prod?.errorLevel === "warning";

export const isInfo = (prod: ProductInfo): boolean => prod?.errorLevel === "info";

export const isPass = (prod: ProductInfo): boolean => prod?.errorLevel === "pass";

export const qualityExists = (prod: ProductInfo): boolean => "errorLevel" in prod && prod.errorLevel !== null;

export const noData = (products: ProductLevels): boolean =>
  products["2"].length == 0 && products["1c"].length == 0 && products["1b"].length == 0;

export function isLegacyOrModel(prod: ProductInfo): boolean {
  return prod.legacy || prod.id == "model";
}

export function isNotLegacy(prod: ProductInfo): boolean {
  return !isLegacy(prod);
}

export function isNotExperimental(prod: ProductInfo): boolean {
  return !isExperimental(prod);
}

export function onlyLegacy(products: ProductLevels) {
  return products["2"].every(isLegacy) && products["1c"].every(isLegacy) && products["1b"].every(isLegacyOrModel);
}

export function onlyLegacyLevel2(products: ProductLevels) {
  return products["2"].length > 0 && products["2"].every(isLegacy);
}

export function onlyModel(products: ProductLevels) {
  return (
    products["2"].length == 0 &&
    products["1c"].length == 0 &&
    products["1b"].length == 1 &&
    products["1b"][0].id == "model"
  );
}

export function getProductStatus(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  return existingProducts.find((prod) => prod.id == productId);
}

export function isLegacyFile(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return existingProduct.legacy;
  }
}

export function isFileWithWarning(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return isWarning(existingProduct);
  }
}

export function isFileWithInfo(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return isInfo(existingProduct);
  }
}

export function isFileWithError(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  if (existingProduct) {
    return isError(existingProduct);
  }
}

export function getReportExists(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  const existingProduct = existingProducts.find((prod) => prod.id == productId);
  return existingProduct && qualityExists(existingProduct);
}

export function hasSomeLevel2Tests(products: ProductLevels) {
  return products["2"].filter(qualityExists).length > 0;
}

export function level2ContainsErrors(products: ProductLevels) {
  return products["2"].filter(isError).length > 0;
}

export function level2containsWarningsOrInfo(products: ProductLevels) {
  return products["2"].filter((x) => isWarning(x) || isInfo(x)).length > 0;
}

export function allLevel2Pass(products: ProductLevels, l2ProductCount: number): boolean {
  return products["2"].filter(isNotExperimental).filter(isPass).length == l2ProductCount;
}

export function allLvl2(products: ProductLevels, l2ProductCount: number): boolean {
  return products["2"].filter(isNotLegacy).filter(isNotExperimental).length == l2ProductCount;
}

export function missingData(products: ProductLevels) {
  return (
    products["2"].filter(isNotLegacy).filter(isNotExperimental).length ||
    products["1c"].filter(isNotLegacy).filter(isNotExperimental).length ||
    products["1b"].filter(isNotLegacy).filter(isNotExperimental).length
  );
}
