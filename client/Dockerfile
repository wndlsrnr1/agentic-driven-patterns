FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CLIENT_INTERNAL_PORT=5173

EXPOSE 5173

CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port ${CLIENT_INTERNAL_PORT}"]
