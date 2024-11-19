import type { Product } from "./Product";
import type { Site } from "./Site";

export interface Collection {
  uuid: string;
  title: string;
  pid: string;
  files: number;
  tombstonedFiles: boolean;
  volatileFiles: boolean;
  size: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  sites: Site[];
  products: Product[];
}
