FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY . .

RUN bun i --frozen-lockfile
RUN bun compile

CMD ["bun", "start"]