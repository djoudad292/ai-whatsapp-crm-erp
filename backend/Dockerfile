FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --no-audit --no-fund

COPY . .

RUN npm --workspace backend run build

FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=build /app/apps/backend/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]