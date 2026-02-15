# ===== Stage 1: Build Frontend =====
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ===== Stage 2: Build Backend =====
FROM rust:1.82-bookworm AS backend-builder
WORKDIR /app/backend
COPY backend/Cargo.toml backend/Cargo.lock* ./
# 建立空的 src 來快取依賴
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src
COPY backend/src ./src
RUN touch src/main.rs && cargo build --release

# ===== Stage 3: Runtime =====
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 複製後端二進位與前端靜態檔案
COPY --from=backend-builder /app/backend/target/release/backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./static

ENV PORT=8080
EXPOSE 8080

CMD ["./backend"]
