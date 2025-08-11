import { compareValues } from "@/lib";

// A generic option type that will work for sites, products, etc.
export interface SortableOption {
  humanReadableName: string;
}

/**
 * Sorts an array of objects alphabetically based on their humanReadableName property.
 * @param a The first object to compare.
 *
 * @param b The second object to compare.
 */
export const alphabeticalSort = <T extends SortableOption>(a: T, b: T): number => {
  return compareValues(a.humanReadableName, b.humanReadableName);
};
