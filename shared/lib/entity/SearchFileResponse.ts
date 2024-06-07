import type { SearchFile } from "./SearchFile";

export interface SearchFileResponse {
  results: SearchFile[];
  pagination: {
    totalItems: number;
    totalPages: number;
    totalBytes: number;
    currentPage: number;
    pageSize: number;
  };
}
