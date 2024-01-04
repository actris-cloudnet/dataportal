import { DataSource, Repository } from "typeorm";
import { Software } from "../entity/Software";
import axios, { AxiosError } from "axios";

interface Metadata {
  humanReadableName: string;
  githubRepository: string;
  zenodoConceptId?: string;
}

export class SoftwareService {
  private softwareRepo: Repository<Software>;
  private pendingRequests: Record<string, Promise<Software>>;

  private METADATA: Record<string, Metadata> = {
    "cloudnet-processing": {
      humanReadableName: "Cloudnet processing",
      githubRepository: "actris-cloudnet/cloudnet-processing",
    },
    "cloudnetpy": {
      humanReadableName: "CloudnetPy",
      githubRepository: "actris-cloudnet/cloudnetpy",
      zenodoConceptId: "3666030",
    },
    "halo-reader": { humanReadableName: "HALO reader", githubRepository: "actris-cloudnet/halo-reader" },
    "mwrpy": { humanReadableName: "MWRPy", githubRepository: "actris-cloudnet/mwrpy" },
    "voodoonet": {
      humanReadableName: "VoodooNet",
      githubRepository: "actris-cloudnet/voodoonet",
      zenodoConceptId: "8263093",
    },
  };

  constructor(dataSource: DataSource) {
    this.softwareRepo = dataSource.getRepository(Software);
    this.pendingRequests = {};
  }

  async getSoftware(code: string, version: string): Promise<Software> {
    const requestId = `${code} ${version}`;
    if (!this.pendingRequests[requestId]) {
      this.pendingRequests[requestId] = this.getOrCreateSoftware(code, version).then((software) => {
        delete this.pendingRequests[requestId];
        return software;
      });
    }
    return this.pendingRequests[requestId];
  }

  private async getOrCreateSoftware(code: string, version: string): Promise<Software> {
    let software = await this.softwareRepo.findOneBy({ code, version });
    if (!software) {
      software = await this.softwareRepo.save({ code, version });
      this.updateMetadataInBackground(software);
    }
    return software;
  }

  private updateMetadataInBackground(software: Software) {
    this.updateMetadata(software).catch((err) => {
      console.error(`Failed to update metadata of ${software.code} ${software.version}:`, err);
    });
  }

  async updateMetadata(software: Software): Promise<void> {
    const metadata = this.METADATA[software.code];
    if (!metadata) {
      return;
    }
    software.humanReadableName = metadata.humanReadableName;
    if (metadata.zenodoConceptId) {
      try {
        const res = await axios.get("https://zenodo.org/api/records", {
          params: {
            q: `parent.id:${metadata.zenodoConceptId} AND metadata.version:v${software.version}`,
            all_versions: "true",
          },
        });
        software.url = res.data[0]?.links?.doi;
      } catch (e: any) {
        console.error("Failed to fetch metadata from Zenodo", e, e.response);
      }
    }
    if (!software.url) {
      software.url = `https://github.com/${metadata.githubRepository}/tree/v${software.version}`;
    }
    await this.softwareRepo.save(software);
  }
}
