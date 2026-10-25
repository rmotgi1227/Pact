# Per build: the build's own source is the context.
FROM pact-base
WORKDIR /app
COPY . .
RUN pnpm install --offline --frozen-lockfile
RUN pnpm build
CMD ["pnpm", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
