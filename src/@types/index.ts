// Interface pour les fournisseurs DNS
export interface DnsProvider {
  addRecord(label: string, target: string, ttl: number): Promise<void>;
  deleteRecord(label: string): Promise<void>;
}
