# Evidências do pipeline

Este arquivo guia a produção das evidências exigidas e serve de base para o PDF do Moodle. **A falha deve ser real**: provocada em uma branch, executada pelo GitHub Actions e depois corrigida por commit.

## Roteiro da falha controlada (teste que quebra o pipeline)

1. Criar a branch: `git switch -c fix/validacao-limit dev`.
2. Provocar a falha: em `src/validation.ts`, mudar o limite máximo de `max = 25` para `max = 50` (uma regra de negócio alterada sem querer). O teste `usa limite padrão quando ausente e rejeita valores fora da faixa` passa a falhar (`parseLimit('26')` deixa de ser `null`).
3. `git commit -am "feat: aumenta limite máximo de resultados" && git push -u origin fix/validacao-limit` e abrir o Pull Request.
4. **Execução com falha:** o job *Build, lint e testes* fica vermelho no passo *Testes automatizados (Jest)* e o job *docker* nem inicia (`needs`). Copie o link da execução e tire print do log mostrando `Expected: null / Received: 26`.
5. **Correção:** reverter para `max = 25` (`git commit -am "fix: restaura limite máximo de 25 conforme contrato da API"`), push.
6. **Execução com sucesso:** o mesmo PR fica verde; copie o link. Faça o merge.

Alternativa de falha: erro de compilação (ex.: tipo errado em `src/app.ts`) que derruba o passo *Compilar TypeScript*.

## Registro (preencher)

| Item | Link / captura |
|---|---|
| Execução com falha (run) | |
| Passo que falhou | Testes automatizados (Jest) |
| Como foi identificada | Log do passo mostrando o teste reprovado |
| Correção (commit/PR) | |
| Execução com sucesso (run) | |
| Resultado dos testes (19 testes) | |
| Artefato `build-<sha>` | |
| Imagem no GHCR (tag) | |
| Execução local da imagem (`docker run` + `/health`) | |
| PRs com revisão cruzada (Ana Júlia ↔ Lara) | |

## Conteúdo sugerido do PDF

1. Descrição do projeto e integrantes (Ana Júlia Pereira da Silva, Lara Abreu Costa de Freitas).
2. Tecnologias.
3. Estratégia de versionamento (`docs/GIT_WORKFLOW.md`) com prints de branches/PRs.
4. Pipeline (README, seção CI/CD) e prints das execuções (sucesso e falha) com explicação.
5. Artefato/imagem publicada.
6. Estratégia de deploy/rollback (`docs/DEPLOY.md`) com print da implantação.
7. Segurança e observabilidade (print do `/health` e dos logs).
