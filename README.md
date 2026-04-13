# docker-manager-ms

API REST + WebSocket para gerenciamento local de containers Docker. Serve como backend do **docker-manager-fe**.

## Stack

| Tecnologia | Papel |
|---|---|
| Express.js v5 + TypeScript | Servidor HTTP |
| Dockerode | Comunicação com o Docker Engine via socket Unix |
| Socket.io | Streams em tempo real (logs, stats, pull de imagens) |
| better-sqlite3 | Metadados dos containers (descrições) persistidos localmente |
| Winston | Logging estruturado |
| js-yaml | Parse de arquivos `docker-compose.yml` |

## Pré-requisitos

- Node.js 20+
- Docker Engine rodando localmente (`/var/run/docker.sock` acessível)
- `docker compose` disponível no PATH (para o módulo Compose)

## Instalação e execução

```bash
npm install
npm run dev       # ts-node-dev com hot-reload
npm run build     # compila para dist/
npm start         # executa dist/server.js
```

A API sobe na porta **8089** por padrão.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta HTTP |
| `CORS_ORIGIN` | `http://localhost:3030` | Origens permitidas (separadas por vírgula) |

Crie um `.env` na raiz para sobrescrever os valores.

## Estrutura

```
src/
├── app.ts                  # Express app + registro de rotas
├── server.ts               # Bootstrap: ping Docker, HTTP server, Socket.io
├── config/
│   ├── docker.ts           # Instância Dockerode + healthcheck
│   ├── database.ts         # SQLite (better-sqlite3) — tabela container_meta
│   └── logger.ts           # Winston
├── modules/
│   ├── containers/
│   │   ├── containers.routes.ts
│   │   ├── containers.controller.ts
│   │   ├── containers.service.ts   # list, inspect, start, stop, restart, remove
│   │   └── meta.service.ts         # descrições salvas em SQLite
│   ├── images/
│   │   ├── images.routes.ts
│   │   ├── images.controller.ts
│   │   └── images.service.ts       # list, remove
│   ├── volumes/
│   │   ├── volumes.routes.ts
│   │   ├── volumes.controller.ts
│   │   └── volumes.service.ts      # list, create, remove
│   ├── networks/
│   │   ├── networks.routes.ts
│   │   ├── networks.controller.ts
│   │   └── networks.service.ts     # list, create, remove
│   ├── compose/
│   │   ├── compose.routes.ts
│   │   ├── compose.controller.ts
│   │   ├── compose.service.ts      # listStacks (docker compose ls), getStackGraph
│   │   ├── compose.parser.ts       # converte YAML → grafo de nós/arestas
│   │   └── compose.types.ts
│   └── metrics/
│       ├── metrics.routes.ts
│       ├── metrics.controller.ts
│       └── metrics.service.ts      # agrega stats de todos os containers ativos
├── socket/
│   ├── index.ts            # namespace /docker, broadcast de eventos Docker
│   └── handlers.ts         # logs, stats e pull de imagens via stream
└── utils/
    └── errors.ts           # AppError, NotFoundError
```

## Endpoints REST

### Health
| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verifica se a API está no ar |

### Containers — `/containers`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/containers` | Lista todos os containers (running + stopped) com metadados |
| GET | `/containers/:id` | Inspeciona um container |
| POST | `/containers/:id/start` | Inicia |
| POST | `/containers/:id/stop` | Para |
| POST | `/containers/:id/restart` | Reinicia |
| DELETE | `/containers/:id` | Remove (force) |
| PATCH | `/containers/:id/meta` | Atualiza descrição customizada |

### Images — `/images`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/images` | Lista imagens locais |
| DELETE | `/images/:id` | Remove uma imagem (force) |

### Volumes — `/volumes`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/volumes` | Lista volumes |
| POST | `/volumes` | Cria um volume (`{ name, driver? }`) |
| DELETE | `/volumes/:name` | Remove um volume |

### Networks — `/networks`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/networks` | Lista redes |
| POST | `/networks` | Cria uma rede (`{ name, driver? }`) |
| DELETE | `/networks/:id` | Remove uma rede |

### Compose — `/compose`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/compose/stacks` | Lista stacks ativas (`docker compose ls`) |
| GET | `/compose/graph?configFile=&includeVolumes=` | Retorna grafo de nós/arestas do stack |

### Metrics — `/metrics`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/metrics` | Snapshot de métricas: contagens de containers, CPU/memória/IO/rede agregados, tamanho de imagens e containers, redes do compose com containers conectados |

## WebSocket — namespace `/docker`

O cliente conecta em `ws://localhost:3001/docker`.

### Eventos de container

| Direção | Evento | Payload |
|---|---|---|
| → server | `container:logs:subscribe` | `{ containerId, tail? }` |
| → server | `container:logs:unsubscribe` | `{ containerId }` |
| ← client | `container:logs:data` | `{ containerId, line, timestamp }` |
| ← client | `container:logs:error` | `{ containerId, error }` |
| → server | `container:stats:subscribe` | `{ containerId }` |
| → server | `container:stats:unsubscribe` | `{ containerId }` |
| ← client | `container:stats:data` | `{ containerId, cpu, memory, memoryLimit, timestamp }` |

### Eventos de imagem

| Direção | Evento | Payload |
|---|---|---|
| → server | `image:pull:start` | `{ image, tag?, auth? }` |
| ← client | `image:pull:progress` | `{ image, status, id, progressDetail }` |
| ← client | `image:pull:done` | `{ image }` |
| ← client | `image:pull:error` | `{ image, error }` |

### Eventos globais do Docker

| Direção | Evento | Payload |
|---|---|---|
| ← client | `container:event` | `{ action, id, name }` — broadcast de eventos de ciclo de vida (start, stop, die, etc.) |

## Persistência

Os metadados de containers (descrições customizadas) são armazenados em `data/meta.db` (SQLite). O arquivo é criado automaticamente na primeira execução.
