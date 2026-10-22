FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["npx", "tsx", "src/main.ts"]
