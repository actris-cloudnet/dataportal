import type { ModelCitation } from "./Citation";

export interface Model {
  id: string;
  humanReadableName: string;
  optimumOrder: number;
  citations: ModelCitation[];
}
