# Stage 1: build
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: production
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk upgrade --no-cache

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

RUN npm ci --omit=dev

USER node

EXPOSE 4000

CMD ["node", "dist/main"]
