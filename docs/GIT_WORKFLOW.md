# Fluxo de trabalho Git

## Criando o repositório

O passo a passo completo (criação do repositório, branches `main` e `dev`, PRs das duas partes e release) está no arquivo `GUIA_GIT_DUAS_PARTES.md` entregue junto com o projeto.

Adicione a outra integrante como colaboradora (Settings → Collaborators) e o professor com acesso de leitura.

## Ciclo de uma funcionalidade

```bash
git switch dev && git pull
git switch -c feature/busca-recordings
# ... alterações ...
git commit -m "feat: adiciona busca de gravações"
git push -u origin feature/busca-recordings
# abrir Pull Request -> dev; a outra integrante revisa e aprova; CI deve estar verde
```

Para publicar uma versão: PR `dev` → `main`, depois `git tag v1.0.0 && git push origin v1.0.0` (gera a imagem `1.0.0`).

## Divisão em duas partes (evidência de colaboração para as duas)

| PR | Autora | Revisora | Conteúdo |
|---|---|---|---|
| `feature/api-musicbrainz` → `dev` | Ana Júlia | Lara | API, testes, lint, CI básico (build + testes), docs de Git |
| `feature/devops-docker-pipeline` → `dev` | Lara | Ana Júlia | Dockerfile, Compose, Trivy, CodeQL, GHCR, deploy/rollback, README completo |
| `fix/validacao-limit` → `dev` | Ana Júlia | Lara | Falha controlada e correção (ver `EVIDENCIAS.md`) |
| `dev` → `main` | Lara | Ana Júlia | Release `v1.0.0` |

Cada integrante deve fazer commits com o **próprio usuário/e-mail** (`git config user.name/user.email`).
