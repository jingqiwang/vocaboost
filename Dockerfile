FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install only production dependencies
# We need to install production dependencies to ensure things like 'adapter-node' runtime requirements are met if any,
# though usually adapter-node bundles everything. However, standard practice often involves just running 'node build'.
# Let's verify if we need to install prod deps. 
# SvelteKit adapter-node usually produces a standalone build in build/ which includes dependencies if configured or 
# relies on node_modules. Standard adapter-node output requires node_modules for dependencies listed in 'dependencies' 
# of package.json if they are not bundled.
# By default adapter-node doesn't bundle node_modules in the output (unless configured with complex Rollup options), 
# so we need to install production dependencies.
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV BODY_SIZE_LIMIT=1G

CMD ["node", "build"]
