import type { ProductLevels, ProductInfo } from "@/lib/DataStatusParser";

export const isLegacy = (prod: ProductInfo): boolean => prod.legacy;

export const isExperimental = (prod: ProductInfo): boolean => prod.experimental;

export const isError = (prod: ProductInfo): boolean => prod?.errorLevel === "error";

export const isWarning = (prod: ProductInfo): boolean => prod?.errorLevel === "warning";

export const isInfo = (prod: ProductInfo): boolean => prod?.errorLevel === "info";

export const isPass = (prod: ProductInfo): boolean => prod?.errorLevel === "pass";

export const qualityExists = (prod: ProductInfo): boolean => "errorLevel" in prod && prod.errorLevel !== null;

export const noData = (products: ProductLevels): boolean =>
  products.instrument.length == 0 && products.synergetic.length == 0;

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
  return products.synergetic.every(isLegacy) && products.instrument.every(isLegacyOrModel);
}

export function onlyLegacySynergetic(products: ProductLevels) {
  return products.synergetic.length > 0 && products.synergetic.every(isLegacy);
}

export function onlyModel(products: ProductLevels) {
  const level1bWithoutExperimental = products.instrument.filter(isNotExperimental);
  return (
    products.synergetic.filter(isNotExperimental).length == 0 &&
    level1bWithoutExperimental.length == 1 &&
    level1bWithoutExperimental[0].id == "model"
  );
}

export function getProductStatus(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  return existingProducts.find((prod) => prod.id == productId);
}

export function isLegacyFile(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  return existingProducts.some((prod) => prod.id === productId && prod.legacy);
}

export function isFileWithWarning(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  return existingProducts.some((prod) => prod.id === productId && isWarning(prod));
}

export function isFileWithInfo(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  return existingProducts.some((prod) => prod.id === productId && isInfo(prod));
}

export function isFileWithError(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  return existingProducts.some((prod) => prod.id === productId && isError(prod));
}

export function getReportExists(existingProducts: ProductInfo[], productId: ProductInfo["id"]) {
  return existingProducts.some((prod) => prod.id === productId && qualityExists(prod));
}

export function hasSomeSynergeticTests(products: ProductLevels) {
  return products.synergetic.filter((x) => isNotExperimental(x) && qualityExists(x)).length > 0;
}

export function synergeticContainsErrors(products: ProductLevels) {
  return products.synergetic.filter((x) => isNotExperimental(x) && isError(x)).length > 0;
}

export function synergeticContainsWarningsOrInfo(products: ProductLevels) {
  return products.synergetic.filter((x) => isNotExperimental(x) && (isWarning(x) || isInfo(x))).length > 0;
}

export function allSynergeticPass(products: ProductLevels, synergeticCount: number): boolean {
  return products.synergetic.filter((x) => isNotExperimental(x) && isPass(x)).length == synergeticCount;
}

export function allSynergetic(products: ProductLevels, synergeticCount: number): boolean {
  return products.synergetic.filter((x) => isNotLegacy(x) && isNotExperimental(x)).length == synergeticCount;
}

export function missingData(products: ProductLevels) {
  return (
    products.synergetic.filter((x) => isNotLegacy(x) && isNotExperimental(x)).length ||
    products.instrument.filter((x) => isNotLegacy(x) && isNotExperimental(x)).length
  );
}

export interface Props {
  siteId: string;
  dataStatus: DataStatus;
  year?: number;
}
import type { DataStatus } from "@/lib/DataStatusParser";

export function filterProductsByLvl(props: Props, lvl: string) {
  if (!props.dataStatus.allProducts) return null;
  return props.dataStatus.allProducts
    .filter(({ id }) => props.dataStatus.lvlTranslate[id] == lvl && id != "model")
    .filter(({ experimental }) => !experimental);
}

export function findProducts(props: Props, lvl: string) {
  if (!props.dataStatus.allProducts) return null;
  return props.dataStatus.allProducts
    .filter(({ id }) => props.dataStatus.lvlTranslate[id] == lvl)
    .filter(({ experimental }) => !experimental)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const toolTipTitle = (prodType: string) => `${prodType.charAt(0).toUpperCase()}${prodType.slice(1)} products`;
