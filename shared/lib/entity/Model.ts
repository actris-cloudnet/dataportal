import type { ModelUpload } from "./Upload";
import type { ModelFile } from "./File";
import type { ModelCitation } from "./Citation";

export interface Model {
  id: string;
  humanReadableName: string;
  optimumOrder: number;
  uploads: ModelUpload[];
  files: ModelFile[];
  citations: ModelCitation[];
}
