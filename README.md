# ADP (React + NestJS)

Practice project for prompt chaining using React(TypeScript) + NestJS.

## Structure

- `client`: React 19 + Vite + React Router + React Query + Axios
- `server`: NestJS API (health + LLM chain)
- `docker-compose.yml`: local split runtime for client/server

## Environment

1. Copy `adp/server/src/config/.env.example` -> `adp/server/src/config/.env`
2. (Optional) Copy `adp/.env.example` -> `adp/.env` for docker-compose port overrides

Server required:

- `PORT` (default: `3001`)
- `CLIENT_ORIGIN` (default: `http://localhost:5173`)
- `SYNTHETIC_API_KEY`
- `SYNTHETIC_BASE_URL` (default: `https://api.synthetic.new/openai/v1`)
- `SYNTHETIC_MODEL` (default: `hf:moonshotai/Kimi-K2.5`)

Client required:

- Runtime API base URL is managed in `client/src/config/settings.ts` (`/api`)
- Dev proxy target is managed in `client/vite.config.ts`

## Local Run

1. Server

```bash
cd adp/server
npm install
npm run dev
```

2. Client

```bash
cd adp/client
npm install
npm run dev
```

## Docker Run

```bash
cd adp
docker compose up --build
```

- Client: `http://localhost:5173`
- Server: `http://localhost:3001/api/health`
- Both services run in watch mode (`npm run dev`) with bind mounts for instant reload.
- Server config values are loaded from `adp/server/src/config/.env` via `ConfigModule` (not from docker-compose `environment`).

If your host ports are already occupied, override them:

```bash
cd adp
ADP_CLIENT_PORT=5174 ADP_SERVER_PORT=3001 docker compose up --build
```

Internal container ports can also be overridden:

```bash
cd adp
ADP_CLIENT_INTERNAL_PORT=5173 ADP_SERVER_INTERNAL_PORT=3001 docker compose up --build
```

## Verification policy

This setup phase does **not** run automated tests by request.
Only build/typecheck/smoke checks are used.

## Verification commands

Server:

```bash
cd adp/server
npm run typecheck
npm run build
```

- Local server build artifacts are written to `adp/server/dist-local`.
- Docker server build artifacts are written to `/tmp/adp-server-dist` inside the container (`ADP_BUILD_MODE=docker`), so host ownership conflicts on `dist-local` do not recur.

Client:

```bash
cd adp/client
npm run typecheck
npm run build
```

Manual smoke:

```bash
# health endpoint
curl http://localhost:3001/api/health

# chain endpoint (requires valid SYNTHETIC_API_KEY)
curl -X POST http://localhost:3001/api/v1/llm/chain \
  -H "Content-Type: application/json" \
  -d '{"textInput":"The new laptop model features a 3.5 GHz octa-core processor, 16GB of RAM, and a 1TB NVMe SSD."}'
```
