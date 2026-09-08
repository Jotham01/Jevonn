FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit-dev

COPY src ./src

RUN mkdir -p /app/data
ENV DB_DIR=/app/data

EXPOSE 4002
ENV PORT=4002

ENV MENU_SERVICE_URL=http://menu-service:4001

CMD ["node", "src/index.js"]