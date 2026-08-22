FROM node:20-alpine

WORKDIR /app

# Copier package.json et installer
COPY backend/package.json ./
COPY backend/package-lock.json ./ 2>/dev/null || true
RUN npm install --include=dev

# Copier le code
COPY backend/ .

# Build
RUN npx prisma generate && npx tsc

# Exposer le port
EXPOSE 4000

# Démarrer
CMD ["node", "dist/index.js"]
