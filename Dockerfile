# Stage de build
FROM node:18-alpine as builder

# Installation de pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de config
COPY package.json pnpm-lock.yaml* tsconfig.json ./

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY src ./src

# Build de l'application
RUN pnpm build

# Stage de production
FROM node:18-alpine

# Installation de pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de production
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copie des fichiers compilés depuis le stage de build
COPY --from=builder /app/dist ./dist

# Utilisateur non-root pour plus de sécurité
# On utilise quand même root car on a besoin d'accéder au socket Docker
USER root

# Définition des variables d'environnement
ENV NODE_ENV=production

# Point d'entrée
CMD ["node", "dist/index.js"]