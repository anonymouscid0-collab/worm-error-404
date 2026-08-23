FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/index.js"]
