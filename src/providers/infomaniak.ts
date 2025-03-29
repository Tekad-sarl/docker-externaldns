import axios, { AxiosResponse } from "axios";
import { DnsProvider } from "../@types";

export interface InfomaniakDnsRecord {
  id: number;
  source: string;
  target: string;
  type: string;
  name: string;
  ttl: number;
  updated_at: number;
}

export interface InfomaniakListResponse<T> {
  result: string;
  data: T[];
  error: {
    code: string;
    description: string;
  };
}

export interface InfomaniakResponse<T> {
  result: string;
  data: T;
  error: {
    code: string;
    description: string;
  };
}

export class InfomaniakDnsProvider implements DnsProvider {
  private apiKey: string;
  private zone: string;

  constructor(apiKey: string, zone: string) {
    if (!apiKey || !zone) {
      throw new Error("Infomaniak API key and zone name are required");
    }
    this.apiKey = apiKey;
    this.zone = zone;
  }

  /**
   * Vérifie que le label contient bien la zone DNS configurée
   * @param label Le label à vérifier (ex: "toto.tekad.ch")
   * @returns true si le label est valide, false sinon
   */
  validateLabel(label: string): string {
    if (!label) {
      throw new Error(`Label is empty"`);
    }

    const labelLower = label.toLowerCase();
    // Vérifie que le label se termine par le domaine configuré
    if (labelLower === this.zone || labelLower.endsWith(`.${this.zone}`)) {
      // Sinon on retire la zone (et le point qui la précède) de la fin du label
      return labelLower.substring(0, labelLower.length - this.zone.length - 1);
    } else {
      throw new Error(
        `Label "${label}" does not belong to zone "${this.zone}"`
      );
    }
  }

  async getRecord(source: string): Promise<InfomaniakDnsRecord | null> {
    try {
      const url = `https://api.infomaniak.com/2/zones/${this.zone}/records?filter[types][]=CNAME&filter[source]=${source}`;
      const response: AxiosResponse<
        InfomaniakListResponse<InfomaniakDnsRecord>
      > = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });
      console.info(JSON.stringify(response.data.data));
      if (response.data.data?.length === 1) {
        return response.data.data[0];
      }
    } catch (error: any) {
      console.error(
        "Failed to fetch records from Infomaniak:",
        error.response?.data || error.message
      );
    }
    return null;
  }

  async addRecord(label: string, target: string, ttl: number): Promise<void> {
    try {
      const source = this.validateLabel(label);
      const existingRecord = await this.getRecord(source);
      if (!existingRecord) {
        const infomaniakRecord = {
          source: source,
          type: "CNAME",
          ttl: ttl,
          target: target,
        };
        const url = `https://api.infomaniak.com/2/zones/${this.zone}/records`;

        // Get current zone configuration
        const createResponse: AxiosResponse<
          InfomaniakResponse<InfomaniakDnsRecord>
        > = await axios.put(url, infomaniakRecord, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (createResponse.data.result === "error") {
          throw new Error(
            "Error adding DNS : " + JSON.stringify(createResponse.data.error)
          );
        }

        console.log(`DNS record ${label} added successfully`);
      } else if (existingRecord.target !== target) {
        //Need update
        const infomaniakRecord = {
          source: source,
          type: "CNAME",
          ttl: ttl,
          target: target,
        };
        const url = `https://api.infomaniak.com/2/zones/${this.zone}/records/${existingRecord.id}`;

        // Get current zone configuration
        const updateResponse: AxiosResponse<
          InfomaniakResponse<InfomaniakDnsRecord>
        > = await axios.put(url, infomaniakRecord, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (updateResponse.data.result === "error") {
          throw new Error(
            "Error updating DNS : " + JSON.stringify(updateResponse.data.error)
          );
        }
        console.log(`DNS record ${label} updated successfully`);
      } else {
        console.log(`DNS record ${label} already stored`);
      }
    } catch (error: any) {
      console.error(
        "Failed to add DNS record:",
        error.response?.data || error.message
      );
    }
  }

  async deleteRecord(label: string): Promise<void> {
    try {
      const source = this.validateLabel(label);
      const existingRecord = await this.getRecord(source);

      if (existingRecord) {
        const url = `https://api.infomaniak.com/2/zones/${this.zone}/records/${existingRecord.id}`;
        // Get current zone configuration
        const deleteResponse: AxiosResponse<
          InfomaniakResponse<InfomaniakDnsRecord>
        > = await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (deleteResponse.data.result === "error") {
          throw new Error(
            "Error deleting DNS : " + JSON.stringify(deleteResponse.data.error)
          );
        }
        console.log(`DNS record ${label} deleted successfully`);
      } else {
        console.log(`No DNS record ${label} to delete`);
      }
    } catch (error: any) {
      console.error(
        "Failed to delete DNS record:",
        error.response?.data || error.message
      );
    }
  }
}
