# menu-service - food catalog microservices
FROM node:20-slim

# better-sqlite3 ships a binary for node20-slim, no build tools needed.
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

RUN mkdir -p /app/data
ENV DB_DIR=/app/data

EXPOSE 4001
ENV PORT=4001
# populate the catalog on first boot if the db is empty (see src/index.js).
ENV SEED_ON_START=true

CMD ["node", "src/index.js"]