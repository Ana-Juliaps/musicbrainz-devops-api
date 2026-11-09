# MusicBrainz DevOps API

API REST em **TypeScript** que consulta a [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) (enciclopédia musical aberta) para buscar artistas, listar lançamentos e pesquisar gravações. Projeto Final da disciplina **Integração DevOps**, cujo foco é o ciclo completo: versionamento, CI, testes, artefato Docker, entrega, segurança e observabilidade.

## Integrantes

- Ana Júlia Pereira da Silva
- Lara Abreu Costa de Freitas

## Tecnologias

| Área | Ferramentas |
|---|---|
| Aplicação | Node.js 20, TypeScript, Express, Helmet, Pino (logs) |
| Testes | Jest, ts-jest, Supertest |
| Qualidade | ESLint (typescript-eslint) |
| CI/CD | GitHub Actions, GitHub Container Registry (GHCR) |
| Contêiner | Docker (multi-stage, usuário não-root), Docker Compose |
| Segurança | npm audit, Trivy (imagem), CodeQL, Dependabot, GitHub Secrets |

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Saúde da aplicação (status, versão, uptime) |
| GET | `/api/artists?query=Nirvana&limit=5` | Busca artistas |
| GET | `/api/artists/:mbid` | Detalhes de um artista (MBID = UUID) |
| GET | `/api/artists/:mbid/releases?limit=5` | Lançamentos do artista |
| GET | `/api/recordings?query=Lithium&limit=5` | Busca gravações |

`limit`: inteiro de 1 a 25 (padrão 10). Erros: `400` (parâmetro inválido), `404` (não encontrado), `502` (falha na MusicBrainz), `500` (erro interno, sem vazar detalhes).

> A MusicBrainz exige `User-Agent` identificável e limita a ~1 requisição/s. A API envia o User-Agent com o e-mail definido em `APP_CONTACT` e aplica um intervalo mínimo entre chamadas (`MB_MIN_INTERVAL_MS`).

## Como executar

### Local (Node)

```bash
cp .env.example .env        # ajuste APP_CONTACT
npm ci
npm run dev                 # http://localhost:3000
```

Build de produção: `npm run build && npm start`.

### Com Docker Compose

```bash
cp .env.example .env
# Imagem local:
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
# Ou imagem publicada no GHCR:
IMAGE_REPO=ghcr.io/<usuario>/musicbrainz-devops-api IMAGE_TAG=1.0.0 docker compose up -d
```

### Testando a API

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/artists?query=Nirvana&limit=3"
curl http://localhost:3000/api/artists/5b11f4ce-a62d-471e-81fc-a69a8278c7da
curl "http://localhost:3000/api/artists/5b11f4ce-a62d-471e-81fc-a69a8278c7da/releases?limit=3"
curl "http://localhost:3000/api/recordings?query=Lithium&limit=3"
```

## Testes automatizados

`npm test` roda **19 testes** em 3 suítes (Jest), sem acessar a internet (a MusicBrainz é simulada por injeção de dependência):

- `tests/validation.test.ts` – validação de MBID, `limit` e termo de busca.
- `tests/client.test.ts` – mapeamento das respostas, User-Agent, 404 e falhas upstream (502).
- `tests/app.test.ts` – endpoints (`/health`, artistas, releases, recordings), 400/404/500.

Um teste que falha faz `npm test` retornar código ≠ 0, o que derruba o job do pipeline.

## Estratégia de versionamento (Git)

Usamos **GitHub Flow com branch `dev` de integração** (simples para uma dupla):

- `main`: sempre estável; só recebe código via Pull Request com CI verde. Tags `vX.Y.Z` marcam releases.
- `dev`: integração das funcionalidades.
- `feature/<descricao>` e `fix/<descricao>`: criadas a partir de `dev`; integradas por Pull Request com revisão da outra integrante.
- Commits no padrão *Conventional Commits* (`feat:`, `fix:`, `test:`, `ci:`, `docs:`).
- Proteção recomendada em `main`: exigir PR, exigir o check **CI** e 1 aprovação.

Passo a passo e divisão de tarefas sugerida: [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md).

## Pipeline de CI/CD

| Workflow | Gatilho | O que faz |
|---|---|---|
| `ci.yml` › **build-test** | push/PR em `main`/`dev`, tags `v*` | checkout → setup Node → `npm ci` → lint → build → testes → `npm audit` → gera artefato `.tgz` |
| `ci.yml` › **docker** | após build-test | build da imagem → **Trivy** → smoke test (`/health` no contêiner) → publica no **GHCR** (exceto em PR) |
| `codeql.yml` | push/PR em `main`, semanal | análise estática de segurança (SAST) |
| `deploy.yml` | manual (`workflow_dispatch`) | implanta uma **tag já publicada** em runner self-hosted (inclui rollback) |

**Separação das etapas:** *Build* (compilar + empacotar) → *Teste* (Jest, lint, audit, Trivy, smoke) → *Entrega* (publicar imagem versionada no GHCR) → *Implantação* (`deploy.yml`/`scripts/deploy.sh`).

## Artefatos e rastreabilidade

- **Pacote da aplicação**: artefato `build-<sha>` na aba *Actions* de cada execução.
- **Imagem Docker**: `ghcr.io/<usuario>/musicbrainz-devops-api` com tags `sha-<7 chars>`, nome da branch, `latest` (main) e `X.Y.Z` (ao criar a tag `vX.Y.Z`). A versão aparece em `/health`.

## Estratégia de implantação, atualização e rollback

Detalhes em [`docs/DEPLOY.md`](docs/DEPLOY.md). Resumo: a implantação usa Docker Compose puxando uma tag imutável do GHCR. `./scripts/deploy.sh 1.1.0` atualiza e valida `/health`; se falhar, volta sozinho à versão anterior. Rollback manual: `./scripts/rollback.sh 1.0.0`.

## Infraestrutura necessária

Docker 24+ e Docker Compose v2; ~256 MB de RAM e 200 MB de disco; saída HTTPS para `musicbrainz.org`; porta 3000 livre. Configuração 100% por variáveis de ambiente (`.env.example`); nenhum segredo no repositório.

## Segurança (DevSecOps)

- Sem segredos no código; `.env` no `.gitignore`; pipeline usa `GITHUB_TOKEN` e **GitHub Secrets** (`APP_CONTACT` no deploy).
- `npm audit` (dependências), **Trivy** (imagem), **CodeQL** (código) e **Dependabot** (atualizações) – detectam problemas cedo, antes do deploy.
- Imagem mínima (alpine, multi-stage, só deps de produção), executa como usuário `node`, Compose com `read_only`, `cap_drop: ALL` e `no-new-privileges`. Helmet nos cabeçalhos HTTP; logs sem headers.
- Permissões mínimas por job (`permissions:` no workflow).

## Observabilidade

- `GET /health` (usado também pelo `HEALTHCHECK` do Docker e pelo deploy).
- Logs JSON estruturados (Pino): cada requisição, avisos de erros da MusicBrainz e erros inesperados. Nível via `LOG_LEVEL`.
- Como detectar falha pós-deploy: `docker compose ps` (status *unhealthy*), `docker compose logs -f api` (procurar `"level":50` ou `"level":40`) e `curl /health`. Veja [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Evidências do GitHub Actions

Roteiro para produzir a falha controlada e o registro das execuções: [`docs/EVIDENCIAS.md`](docs/EVIDENCIAS.md). Preencha os links abaixo depois de executar:

- ✅ Execução com sucesso: _<link>_
- ❌ Execução com falha: _<link>_ (causa e correção em `docs/EVIDENCIAS.md`)
- 📦 Imagem no GHCR: _<link>_
