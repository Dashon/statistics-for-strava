FROM php:8.3-fpm-alpine

WORKDIR /var/www

# Install dependencies
RUN apk add --no-cache \
  bash \
  curl \
  nginx \
  supervisor \
  tzdata \
  geos \
  postgresql-dev \
  freetype-dev \
  libjpeg-turbo-dev \
  libpng-dev \
  libzip-dev \
  icu-dev \
  oniguruma-dev

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) \
    bcmath \
    gd \
    intl \
    mbstring \
    opcache \
    pdo \
    pdo_pgsql \
    pdo_mysql \
    pcntl \
    zip

# Copy PHP configuration
COPY docker/app/config/php.ini ${PHP_INI_DIR}/conf.d/custom.ini

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# https://getcomposer.org/doc/03-cli.md#composer-allow-superuser
ENV COMPOSER_ALLOW_SUPERUSER=1

# Add application
COPY . /var/www/
RUN touch /var/www/.env
RUN rm -Rf docker
RUN mkdir -p /var/www/var/cache/prod /var/www/var/log
RUN chown -R www-data:www-data /var/www/var

# Install Shoutrrr
ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH:-amd64}
ARG SHOUTRRR_VERSION="0.13.1"

RUN if [ "${TARGETARCH}" = "arm64" ]; then \
      curl -L -o shoutrrr.tar.gz "https://github.com/nicholas-fedor/shoutrrr/releases/download/v$SHOUTRRR_VERSION/shoutrrr_linux_arm64v8_${SHOUTRRR_VERSION}.tar.gz"; \
    else \
      curl -L -o shoutrrr.tar.gz "https://github.com/nicholas-fedor/shoutrrr/releases/download/v$SHOUTRRR_VERSION/shoutrrr_linux_amd64_${SHOUTRRR_VERSION}.tar.gz"; \
    fi \
  && tar -xzf shoutrrr.tar.gz \
  && chmod +x shoutrrr \
  && mv shoutrrr /usr/bin/shoutrrr \
  && rm shoutrrr.tar.gz

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
