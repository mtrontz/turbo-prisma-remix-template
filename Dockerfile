# -----------------------------------------------
# BASE NODE IMAGE!!
# -----------------------------------------------
FROM node:16-bullseye-slim as base

# Install openssl for Prisma & git for Turbo repo 

RUN apt-get update && apt-get install -y openssl && apt-get install -y git 


# Update to latest NPM
RUN npm install -g npm@8.4.1

# Install all root node_modules, including dev dependencies
FROM base as deps

# Create an app directory and set as the cwd
RUN mkdir /app
WORKDIR /app

# Copy package.json file to root
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY . . 
# COPY apps ./
# COPY packages ./

# Install root deps
# turbo etc
RUN npm install --production=false
RUN npx metronome setup

# -----------------------------------------------
# SET UP PRODUCTION NODE_MODULES
# -----------------------------------------------
FROM base as production-deps

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json package-lock.json ./
COPY . . 
RUN npm prune --production

# -----------------------------------------------
# BUILD PACKAGES & APPS (TESTS ETC)
# -----------------------------------------------
FROM base as build

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json package-lock.json ./
COPY turbo.json ./
# COPY fly.toml ./
COPY . . 
# COPY PRISMA SCHEMA AND GENERATE MODELS / TYPES
COPY prisma .
RUN npx prisma generate
RUN npm run build
# RUN turbo run build --scope=blog --include-dependencies --no-deps

# -----------------------------------------------
# BUILD PRODUCTION IMAGE WITH MINIMAL FOOTPRINT
# -----------------------------------------------
FROM base

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
# COPY --from=build /app /app

COPY --from=build /app/packages/ui/dist /app/packages/ui/dist
COPY packages/ui/package.json /app/packages/ui/package.json

COPY --from=build /app/apps/blog/build /app/build
COPY --from=build /app/apps/blog/public /app/public
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/start_with_migrations.sh /app/start_with_migrations.sh
# COPY --from=build /app/fly.toml /app/fly.toml
COPY --from=build /app/apps/blog/package.json /app/package.json

# COPY .env /app/.env

CMD ["npm", "run", "start"]
