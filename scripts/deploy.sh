#!/usr/bin/env bash
# Uso: ./scripts/deploy.sh <tag>      ex.: ./scripts/deploy.sh 1.2.0
# Implanta (ou atualiza) a versão <tag> da imagem e valida o /health.
# Se a verificação falhar, volta automaticamente para a versão anterior (rollback).
set -euo pipefail

NEW_TAG="${1:?informe a tag da imagem (ex.: 1.2.0)}"
STATE_FILE=".deployed_tag"
PREV_TAG="$(cat "$STATE_FILE" 2>/dev/null || echo "")"
HOST_PORT="${HOST_PORT:-3000}"

health_check() {
  for _ in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:${HOST_PORT}/health" >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  return 1
}

deploy() {
  export IMAGE_TAG="$1"
  docker compose pull
  docker compose up -d --remove-orphans
}

echo ">> Implantando versão ${NEW_TAG} (anterior: ${PREV_TAG:-nenhuma})"
deploy "$NEW_TAG"

if health_check; then
  echo "$NEW_TAG" > "$STATE_FILE"
  echo ">> OK: versão ${NEW_TAG} saudável."
else
  echo "!! /health falhou na versão ${NEW_TAG}."
  if [[ -n "$PREV_TAG" ]]; then
    echo ">> Rollback para ${PREV_TAG}"
    deploy "$PREV_TAG"
    health_check && echo ">> Rollback concluído." || echo "!! Rollback também falhou; verifique 'docker compose logs'."
  fi
  exit 1
fi
