---
name: docker-patterns
version: 1.0.0
---

# Docker Patterns

## PHP (PHP-FPM + Nginx)

```dockerfile
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    libzip-dev \
    && docker-php-ext-install pdo_mysql zip opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY . /var/www/html
WORKDIR /var/www/html

RUN composer install --no-dev --optimize-autoloader
RUN chown -R www-data:www-data /var/www/html

EXPOSE 9000
CMD ["php-fpm"]
```

## Node.js (Multi-stage)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Rules

1. **Multi-stage builds** — smaller images
2. **Alpine base** — minimal attack surface
3. **.dockerignore** — exclude node_modules, .git
4. **Non-root user** — security
5. **Health checks** — always include
