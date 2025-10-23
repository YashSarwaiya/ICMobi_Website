# ================================
# Stage 1: Build React frontend
# ================================
FROM node:18 AS client-build

WORKDIR /icmobi-website/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build


# ================================
# Stage 2: Build server + server frontend
# ================================
FROM node:18 AS server

WORKDIR /icmobi-website

# Copy server dependencies
COPY backend/package*.json ./backend/
WORKDIR /icmobi-website/backend
RUN npm install --legacy-peer-deps

# Copy server code
COPY backend/ ./ 

# Copy built React frontend into server's public dir
WORKDIR /icmobi-website
COPY --from=client-build /icmobi-website/frontend/build ./backend/public

EXPOSE 5000
CMD ["node", "backend/index.js"]
