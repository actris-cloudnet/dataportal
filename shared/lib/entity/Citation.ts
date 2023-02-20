import type { Site } from "./Site";
import type { Model } from "./Model";

export interface Citation {
  id: string;
  acknowledgements: string;
}

export interface RegularCitation extends Citation {
  sites: Site[];
}

export interface ModelCitation extends Citation {
  models: Model[];
}
