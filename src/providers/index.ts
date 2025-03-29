import { DnsProvider } from "../@types";
import { InfomaniakDnsProvider } from "./infomaniak";

// Factory pour créer les providers DNS
export class DnsProviderFactory {
  static createProvider(providerType: string, config: any): DnsProvider {
    switch (providerType.toLowerCase()) {
      case "infomaniak":
        return new InfomaniakDnsProvider(config.apiKey, config.zone);
      // Ajoutez d'autres cas ici pour de nouveaux providers
      default:
        throw new Error(`DNS provider '${providerType}' not supported`);
    }
  }
}

export { InfomaniakDnsProvider };
