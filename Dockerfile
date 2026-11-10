FROM node:22-slim

# The workerd runtime behind `wrangler dev` refuses to start without system CA
# certificates, and the slim image ships none.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

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
