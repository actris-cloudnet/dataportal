import type { NewsItem } from "./NewsItem";

export interface NewsPaginatedResponse {
  results: NewsItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
