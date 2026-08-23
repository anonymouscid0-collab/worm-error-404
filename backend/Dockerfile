FROM node:20-alpine

WORKDIR /app

# Installer toutes les dépendances
COPY package.json ./
RUN npm install

# Copier le code
COPY . .

# Générer Prisma et compiler TypeScript
RUN npx prisma generate && npx tsc

# Nettoyer les devDependencies
RUN npm prune --production

EXPOSE 4000

CMD ["node", "dist/index.js"]
