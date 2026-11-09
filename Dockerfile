FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Database and uploaded images live here. Mount a persistent volume at /app/data.
ENV DATA_DIR=/app/data
VOLUME ["/app/data"]
EXPOSE 3000

CMD ["npm", "run", "start"]
