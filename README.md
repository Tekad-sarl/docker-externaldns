# Docker ExternalDNS

Un service léger qui gère automatiquement les enregistrements DNS basés sur les événements des conteneurs Docker. Il surveille les conteneurs avec des labels spécifiques et crée/met à jour/supprime les enregistrements DNS en conséquence.

## Fonctionnalités

- Crée automatiquement des entrées DNS lorsque les conteneurs démarrent
- Supprime automatiquement les entrées DNS lorsque les conteneurs sont détruits
- Prend en charge l'extraction de sous-domaines à partir de labels (par exemple, `test.toto.domain.com`)
- Architecture modulaire pour la prise en charge de plusieurs fournisseurs DNS
- Construit avec TypeScript pour plus de fiabilité
- Déploiement simple avec Docker

## Fournisseurs DNS actuellement pris en charge

- **Infomaniak** - Fournisseur d'hébergement suisse avec API DNS

## Installation

### Utilisation de Docker (Recommandé)

```bash
# Télécharger l'image
docker pull ghcr.io/yourusername/docker-externaldns:latest

# Exécuter avec des variables d'environnement
docker run -d \
  --name external-dns \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e TARGET_HOST=yourdomain.com \
  -e DNS_PROVIDER_TYPE=infomaniak \
  -e INFOMANIAK_API_KEY=your_api_key \
  -e INFOMANIAK_ZONE=your_zone_id \
  ghcr.io/yourusername/docker-externaldns:latest
```

### Utilisation de Docker Compose

```yaml
version: "3.8"

services:
  external-dns:
    image: ghcr.io/yourusername/docker-externaldns:latest
    container_name: external-dns
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - TARGET_HOST=yourdomain.com
      - DNS_PROVIDER_TYPE=infomaniak
      - INFOMANIAK_API_KEY=your_api_key_here
      - INFOMANIAK_ZONE=your_zone_id_here
      - DOCKER_LABEL=external.dns
```

### Installation manuelle

```bash
# Cloner le dépôt
git clone https://github.com/yourusername/docker-externaldns.git
cd docker-externaldns

# Installer les dépendances
pnpm install

# Construire le projet
pnpm build

# Lancer le service
pnpm start
```

## Configuration

### Variables d'environnement

| Variable             | Description                                           | Défaut         | Obligatoire           |
| -------------------- | ----------------------------------------------------- | -------------- | --------------------- |
| `TARGET_HOST`        | Le nom d'hôte/adresse IP pour les enregistrements DNS | -              | Oui                   |
| `DNS_PROVIDER_TYPE`  | Fournisseur DNS à utiliser                            | `infomaniak`   | Non                   |
| `DOCKER_LABEL`       | Label Docker à surveiller pour les entrées DNS        | `external.dns` | Non                   |
| `INFOMANIAK_API_KEY` | Clé API Infomaniak                                    | -              | Oui (pour Infomaniak) |
| `INFOMANIAK_ZONE`    | ID de zone DNS Infomaniak                             | -              | Oui (pour Infomaniak) |

Pour le développement ou les tests, vous pouvez créer un fichier `.env` basé sur le `.env.example` fourni.

## Utilisation

### Labels Docker

Pour utiliser ce service, ajoutez un label à vos conteneurs Docker avec le nom DNS :

```yaml
services:
  my-app:
    image: nginx:alpine
    labels:
      - external.dns=myapp.example.com
```

Lorsque le conteneur démarre, un enregistrement CNAME sera automatiquement créé pointant `myapp.example.com` vers votre `TARGET_HOST`. Lorsque le conteneur est détruit, l'enregistrement DNS sera supprimé.

### Exemples

#### Application Web Simple

```yaml
services:
  wordpress:
    image: wordpress:latest
    labels:
      - external.dns=blog.example.com

  dashboard:
    image: grafana/grafana:latest
    labels:
      - external.dns=dashboard.example.com
```

## Développement

### Structure du projet

```
/
├── src/
│   ├── @types/           # Interfaces TypeScript
│   ├── providers/        # Implémentations des fournisseurs DNS
│   │   ├── index.ts      # Factory pour créer des fournisseurs DNS
│   │   └── infomaniak.ts # Implémentation du fournisseur Infomaniak
│   └── index.ts          # Application principale
├── tsconfig.json         # Configuration TypeScript
└── Dockerfile            # Définition de build Docker
```

### Ajout d'un nouveau fournisseur DNS

1. Implémentez l'interface `DnsProvider` dans un nouveau fichier sous `src/providers/`
2. Mettez à jour la factory dans `src/providers/index.ts` pour inclure votre nouveau fournisseur
3. Ajoutez le traitement approprié des variables d'environnement dans le fichier principal `index.ts`

Exemple d'implémentation d'un nouveau fournisseur :

```typescript
// src/providers/newprovider.ts
import { DnsProvider } from "../@types";

export class NewProvider implements DnsProvider {
  constructor(config) {
    // Initialisation avec la configuration spécifique au fournisseur
  }

  async addRecord(label: string, target: string, ttl: number): Promise<void> {
    // Implémentation
  }

  async deleteRecord(label: string): Promise<void> {
    // Implémentation
  }
}

// Puis ajoutez dans src/providers/index.ts
case "newprovider":
  return new NewProvider(config);
```

## Licence

[Licence MIT](LICENSE)

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à soumettre des issues ou des pull requests.
