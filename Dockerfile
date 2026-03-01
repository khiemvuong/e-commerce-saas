# ------------------------------------
# 1. Cài đặt các thư viện (Deps)
# ------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile để cài đặt dependency một cách ổn định
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------
# 2. Build ứng dụng user-ui bằng Nx
# ------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Chỉ thị cho Nx build riêng project user-ui
RUN npx nx build user-ui --prod

# ------------------------------------
# 3. Môi trường Runner (Chạy ứng dụng)
# ------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000

# Tạo non-root user (Best practice trên K8s)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy file .env của frontend (nếu bạn có load biến ở lúc run)
# Về cơ bản, khi deploy lên TOSE, bạn có thể đẩy biến từ `tose env push apps/user-ui/.env` thay vì copy
# COPY apps/user-ui/.env ./apps/user-ui/.env

# Copy các thư viện public và các asset cần thiết
COPY --from=builder /app/dist/apps/user-ui/public ./dist/apps/user-ui/public

# Copy mã nguồn Standalone đã được minify
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/user-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/user-ui/.next/static ./dist/apps/user-ui/.next/static

# Chạy server
CMD ["node", "apps/user-ui/server.js"]
