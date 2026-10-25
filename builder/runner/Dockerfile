# Built once: docker build -t pact-runner builder/runner
FROM mcr.microsoft.com/playwright:v1.48.0-noble
WORKDIR /tests
COPY package.json package-lock.json ./
RUN npm ci
COPY playwright.config.ts .
# Specs are not baked in: each run bind-mounts that build's generated specs at /tests/tests.
CMD ["npx", "playwright", "test", "--reporter=json"]
