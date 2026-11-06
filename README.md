# MusicBrainz DevOps API

API REST em **TypeScript** que consulta a [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) para buscar artistas, listar lançamentos e pesquisar gravações. Projeto Final da disciplina **Integração DevOps**.

## Integrantes

- Ana Júlia Pereira da Silva
- Lara Abreu Costa de Freitas

## Tecnologias

Node.js 20, TypeScript, Express, Helmet, Pino (logs), Jest + Supertest, ESLint, GitHub Actions.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Saúde da aplicação (status, versão, uptime) |
| GET | `/api/artists?query=Nirvana&limit=5` | Busca artistas |
| GET | `/api/artists/:mbid` | Detalhes de um artista (MBID = UUID) |
| GET | `/api/artists/:mbid/releases?limit=5` | Lançamentos do artista |
| GET | `/api/recordings?query=Lithium&limit=5` | Busca gravações |

`limit`: inteiro de 1 a 25 (padrão 10). Erros: `400`, `404`, `502` (falha na MusicBrainz) e `500`.

## Como executar

```bash
cp .env.example .env      # defina APP_CONTACT com um contato (exigência da MusicBrainz)
npm ci
npm run dev               # http://localhost:3000
```

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/artists?query=Nirvana&limit=3"
```

## Testes

`npm test` executa 19 testes (Jest) sem acessar a internet. `npm run lint` e `npm run build` completam a validação.

## Git e CI

Branches: `main` (estável), `dev` (integração) e `feature/*`/`fix/*` (via Pull Request com revisão da outra integrante). Detalhes em [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md).

O workflow `.github/workflows/ci.yml` roda em push/PR para `main` e `dev`: checkout → Node 20 → `npm ci` → lint → build → testes → `npm audit` → gera o artefato `.tgz`.

> Conteúdo de Docker, deploy, segurança avançada e evidências completas entra na Parte 2.
