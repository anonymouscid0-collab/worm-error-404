FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./ 2>/dev/null || true
RUN npm install --include=dev

COPY . .

RUN npx prisma generate && npx tsc

EXPOSE 4000

CMD ["node", "dist/index.js"]
