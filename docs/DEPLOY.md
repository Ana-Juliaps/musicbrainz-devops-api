# Estratégia de entrega e implantação

## Visão geral

1. **Build** (CI): `npm ci` → compilar TypeScript → pacote `.tgz`.
2. **Teste** (CI): lint, Jest, `npm audit`, Trivy na imagem, smoke test do contêiner.
3. **Entrega** (CI): a imagem aprovada é publicada no GHCR com tags imutáveis (`sha-xxxxxxx`) e de versão (`X.Y.Z`).
4. **Implantação** (CD): um ambiente (local ou servidor) executa `docker compose pull && up -d` apontando para uma tag específica. A imagem **não é reconstruída** na implantação: o mesmo artefato testado é o que roda.

## Implantação local (demonstração)

```bash
cp .env.example .env     # defina APP_CONTACT
export IMAGE_REPO=ghcr.io/<usuario>/musicbrainz-devops-api
./scripts/deploy.sh 1.0.0
curl localhost:3000/health   # {"status":"ok","version":"...", ...}
```

(Se o pacote do GHCR for privado: `echo $GH_PAT | docker login ghcr.io -u <usuario> --password-stdin`, com um token de leitura `read:packages`.)

Também é possível implantar via GitHub Actions: workflow **Deploy (manual)** com a tag desejada, executado em um self-hosted runner (opcional).

## Atualização de versão

1. Merge da `dev` em `main` via PR (CI verde).
2. `git tag v1.1.0 && git push origin v1.1.0` → CI publica a imagem `1.1.0`.
3. `./scripts/deploy.sh 1.1.0`: puxa a imagem, sobe o contêiner e consulta `/health` (até 40 s).
4. Se saudável, grava a versão em `.deployed_tag`; se não, **faz rollback automático** para a anterior.

## Rollback

- Automático: no próprio `deploy.sh` (falha de `/health`).
- Manual: `./scripts/rollback.sh 1.0.0` (usa a mesma rotina, apontando para a tag antiga). Como as tags são imutáveis no GHCR, voltar é só trocar a tag.

## Detectando falhas após o deploy

| Sintoma | Como identificar |
|---|---|
| Contêiner não sobe/reinicia | `docker compose ps` (Restarting/unhealthy) |
| Aplicação não responde | `curl -i localhost:3000/health` |
| Erros em requisições | `docker compose logs -f api` — linhas JSON com `"level":50` (erro) / `"level":40` (aviso, ex.: falha na MusicBrainz) |
| Versão errada em produção | campo `version` do `/health` |

Simulação de falha para a demonstração: `MUSICBRAINZ_BASE_URL=https://invalido.example` → `/api/artists` passa a retornar erro 500 com log `"level":50`, enquanto `/health` segue `ok` (mostra a diferença entre *processo vivo* e *dependência com problema*).

## Evolução possível (diferencial)

Prometheus + Grafana via Compose (métricas HTTP com `prom-client`) e OpenTelemetry para tracing.
