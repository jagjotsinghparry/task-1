# Dockerfile for T3 app (Next.js + Node.js)
FROM node:22.18.0-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
    else npm install; fi

# Copy rest of the app
COPY . .

# Build the app
RUN npm run build

# Expose port (default Next.js port)
EXPOSE 3000


# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
